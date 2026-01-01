"""
Secure Credential Vault Service
- AES/Fernet encryption for secrets
- Audit logging for all credential access
- Session management for browser automation
"""
import os
import json
import base64
import hashlib
from datetime import datetime, timezone, timedelta
from typing import Optional, Dict, Any, List
from cryptography.fernet import Fernet
from cryptography.hazmat.primitives import hashes
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
import logging

logger = logging.getLogger(__name__)


class CredentialVaultService:
    """
    Secure credential storage with encryption and audit logging.
    Uses Fernet (AES-128-CBC) for encryption.
    
    For production, replace with AWS KMS/Secrets Manager integration.
    """
    
    def __init__(self, db, master_key: Optional[str] = None):
        self.db = db
        self._init_encryption(master_key)
    
    def _init_encryption(self, master_key: Optional[str] = None):
        """Initialize Fernet cipher with master key."""
        key = master_key or os.environ.get('CREDENTIAL_MASTER_KEY')
        
        if not key:
            # Generate a key for development (NOT for production)
            logger.warning("No master key provided, generating ephemeral key. DO NOT USE IN PRODUCTION.")
            key = Fernet.generate_key().decode()
        
        # Derive a proper Fernet key from the master key
        if len(key) != 44:  # Fernet keys are 44 bytes base64
            # Use PBKDF2 to derive a proper key
            kdf = PBKDF2HMAC(
                algorithm=hashes.SHA256(),
                length=32,
                salt=b'job_finder_salt_v1',  # Fixed salt for deterministic derivation
                iterations=100000,
            )
            derived_key = base64.urlsafe_b64encode(kdf.derive(key.encode()))
            self._fernet = Fernet(derived_key)
        else:
            self._fernet = Fernet(key.encode())
    
    def encrypt(self, plaintext: str) -> str:
        """Encrypt a string and return base64-encoded ciphertext."""
        if not plaintext:
            return ""
        return self._fernet.encrypt(plaintext.encode()).decode()
    
    def decrypt(self, ciphertext: str) -> str:
        """Decrypt base64-encoded ciphertext and return plaintext."""
        if not ciphertext:
            return ""
        try:
            return self._fernet.decrypt(ciphertext.encode()).decode()
        except Exception as e:
            logger.error(f"Decryption failed: {e}")
            return ""
    
    async def create_credential(
        self,
        user_id: str,
        name: str,
        source_id: str,
        credential_type: str = "username_password",
        username: Optional[str] = None,
        password: Optional[str] = None,
        api_key: Optional[str] = None,
        notes: str = "",
        ip_address: str = "",
        user_agent: str = ""
    ) -> Dict[str, Any]:
        """Create a new credential with encrypted fields."""
        from app.models.schemas import generate_id, utc_now_iso
        
        cred_id = generate_id()
        now = utc_now_iso()
        
        credential_doc = {
            "id": cred_id,
            "user_id": user_id,
            "name": name,
            "source_id": source_id,
            "credential_type": credential_type,
            "encrypted_username": self.encrypt(username) if username else "",
            "encrypted_password": self.encrypt(password) if password else "",
            "encrypted_api_key": self.encrypt(api_key) if api_key else "",
            "encrypted_cookies": "",
            "encrypted_session_data": "",
            "last_used_at": "",
            "last_success_at": "",
            "is_valid": True,
            "notes": notes,
            "created_at": now,
            "updated_at": now
        }
        
        await self.db.credentials.insert_one(credential_doc)
        
        # Audit log
        await self._audit_log(
            credential_id=cred_id,
            user_id=user_id,
            action="created",
            details={"source_id": source_id, "credential_type": credential_type},
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        return self._sanitize_credential(credential_doc)
    
    async def get_credential(
        self,
        credential_id: str,
        user_id: str,
        include_secrets: bool = False,
        ip_address: str = "",
        user_agent: str = ""
    ) -> Optional[Dict[str, Any]]:
        """Get a credential by ID. Only returns secrets if explicitly requested."""
        cred = await self.db.credentials.find_one(
            {"id": credential_id, "user_id": user_id},
            {"_id": 0}
        )
        
        if not cred:
            return None
        
        # Audit log for access
        await self._audit_log(
            credential_id=credential_id,
            user_id=user_id,
            action="accessed",
            details={"include_secrets": include_secrets},
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        if include_secrets:
            return self._decrypt_credential(cred)
        return self._sanitize_credential(cred)
    
    async def get_credentials_for_source(
        self,
        user_id: str,
        source_id: str,
        include_secrets: bool = False,
        ip_address: str = "",
        user_agent: str = ""
    ) -> List[Dict[str, Any]]:
        """Get all credentials for a specific source."""
        creds = await self.db.credentials.find(
            {"user_id": user_id, "source_id": source_id, "is_valid": True},
            {"_id": 0}
        ).to_list(100)
        
        if include_secrets:
            for cred in creds:
                await self._audit_log(
                    credential_id=cred["id"],
                    user_id=user_id,
                    action="accessed",
                    details={"for_source": source_id, "include_secrets": True},
                    ip_address=ip_address,
                    user_agent=user_agent
                )
            return [self._decrypt_credential(c) for c in creds]
        return [self._sanitize_credential(c) for c in creds]
    
    async def list_credentials(self, user_id: str) -> List[Dict[str, Any]]:
        """List all credentials for a user (without secrets)."""
        creds = await self.db.credentials.find(
            {"user_id": user_id},
            {"_id": 0}
        ).to_list(100)
        return [self._sanitize_credential(c) for c in creds]
    
    async def update_credential(
        self,
        credential_id: str,
        user_id: str,
        updates: Dict[str, Any],
        ip_address: str = "",
        user_agent: str = ""
    ) -> Optional[Dict[str, Any]]:
        """Update credential fields."""
        from app.models.schemas import utc_now_iso
        
        # Build update document
        update_doc = {"updated_at": utc_now_iso()}
        
        # Encrypt sensitive fields if provided
        if "username" in updates and updates["username"]:
            update_doc["encrypted_username"] = self.encrypt(updates["username"])
        if "password" in updates and updates["password"]:
            update_doc["encrypted_password"] = self.encrypt(updates["password"])
        if "api_key" in updates and updates["api_key"]:
            update_doc["encrypted_api_key"] = self.encrypt(updates["api_key"])
        
        # Non-sensitive updates
        for field in ["name", "notes", "is_valid"]:
            if field in updates:
                update_doc[field] = updates[field]
        
        result = await self.db.credentials.update_one(
            {"id": credential_id, "user_id": user_id},
            {"$set": update_doc}
        )
        
        if result.modified_count > 0:
            await self._audit_log(
                credential_id=credential_id,
                user_id=user_id,
                action="updated",
                details={"fields_updated": list(update_doc.keys())},
                ip_address=ip_address,
                user_agent=user_agent
            )
        
        return await self.get_credential(credential_id, user_id)
    
    async def delete_credential(
        self,
        credential_id: str,
        user_id: str,
        ip_address: str = "",
        user_agent: str = ""
    ) -> bool:
        """Delete a credential."""
        result = await self.db.credentials.delete_one(
            {"id": credential_id, "user_id": user_id}
        )
        
        if result.deleted_count > 0:
            await self._audit_log(
                credential_id=credential_id,
                user_id=user_id,
                action="deleted",
                details={},
                ip_address=ip_address,
                user_agent=user_agent
            )
            return True
        return False
    
    async def store_session_cookies(
        self,
        credential_id: str,
        user_id: str,
        cookies: List[Dict[str, Any]],
        ip_address: str = "",
        user_agent: str = ""
    ) -> bool:
        """Store encrypted session cookies for browser automation."""
        from app.models.schemas import utc_now_iso
        
        encrypted_cookies = self.encrypt(json.dumps(cookies))
        
        result = await self.db.credentials.update_one(
            {"id": credential_id, "user_id": user_id},
            {"$set": {
                "encrypted_cookies": encrypted_cookies,
                "last_used_at": utc_now_iso(),
                "updated_at": utc_now_iso()
            }}
        )
        
        if result.modified_count > 0:
            await self._audit_log(
                credential_id=credential_id,
                user_id=user_id,
                action="cookies_stored",
                details={"cookie_count": len(cookies)},
                ip_address=ip_address,
                user_agent=user_agent
            )
            return True
        return False
    
    async def get_session_cookies(
        self,
        credential_id: str,
        user_id: str,
        ip_address: str = "",
        user_agent: str = ""
    ) -> List[Dict[str, Any]]:
        """Retrieve decrypted session cookies."""
        cred = await self.db.credentials.find_one(
            {"id": credential_id, "user_id": user_id},
            {"_id": 0, "encrypted_cookies": 1}
        )
        
        if not cred or not cred.get("encrypted_cookies"):
            return []
        
        await self._audit_log(
            credential_id=credential_id,
            user_id=user_id,
            action="cookies_accessed",
            details={},
            ip_address=ip_address,
            user_agent=user_agent
        )
        
        try:
            cookies_json = self.decrypt(cred["encrypted_cookies"])
            return json.loads(cookies_json) if cookies_json else []
        except Exception as e:
            logger.error(f"Failed to decrypt cookies: {e}")
            return []
    
    async def mark_credential_used(
        self,
        credential_id: str,
        user_id: str,
        success: bool = True,
        ip_address: str = "",
        user_agent: str = ""
    ):
        """Mark credential as used (for login attempts)."""
        from app.models.schemas import utc_now_iso
        
        update_doc = {"last_used_at": utc_now_iso()}
        if success:
            update_doc["last_success_at"] = utc_now_iso()
            update_doc["is_valid"] = True
        
        await self.db.credentials.update_one(
            {"id": credential_id, "user_id": user_id},
            {"$set": update_doc}
        )
        
        await self._audit_log(
            credential_id=credential_id,
            user_id=user_id,
            action="used_for_login",
            details={"success": success},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    async def invalidate_credential(
        self,
        credential_id: str,
        user_id: str,
        reason: str = "",
        ip_address: str = "",
        user_agent: str = ""
    ):
        """Mark credential as invalid (failed login, expired, etc.)."""
        from app.models.schemas import utc_now_iso
        
        await self.db.credentials.update_one(
            {"id": credential_id, "user_id": user_id},
            {"$set": {
                "is_valid": False,
                "updated_at": utc_now_iso()
            }}
        )
        
        await self._audit_log(
            credential_id=credential_id,
            user_id=user_id,
            action="invalidated",
            details={"reason": reason},
            ip_address=ip_address,
            user_agent=user_agent
        )
    
    async def _audit_log(
        self,
        credential_id: str,
        user_id: str,
        action: str,
        details: Dict[str, Any],
        ip_address: str = "",
        user_agent: str = ""
    ):
        """Write audit log entry for credential access."""
        from app.models.schemas import generate_id, utc_now_iso
        
        log_entry = {
            "id": generate_id(),
            "credential_id": credential_id,
            "user_id": user_id,
            "action": action,
            "details": details,
            "ip_address": ip_address,
            "user_agent": user_agent,
            "timestamp": utc_now_iso()
        }
        
        await self.db.credential_audit_logs.insert_one(log_entry)
    
    async def get_audit_logs(
        self,
        user_id: str,
        credential_id: Optional[str] = None,
        limit: int = 100
    ) -> List[Dict[str, Any]]:
        """Get audit logs for a user's credentials."""
        query = {"user_id": user_id}
        if credential_id:
            query["credential_id"] = credential_id
        
        logs = await self.db.credential_audit_logs.find(
            query, {"_id": 0}
        ).sort("timestamp", -1).limit(limit).to_list(limit)
        
        return logs
    
    def _decrypt_credential(self, cred: Dict[str, Any]) -> Dict[str, Any]:
        """Decrypt all sensitive fields in a credential."""
        decrypted = dict(cred)
        decrypted["username"] = self.decrypt(cred.get("encrypted_username", ""))
        decrypted["password"] = self.decrypt(cred.get("encrypted_password", ""))
        decrypted["api_key"] = self.decrypt(cred.get("encrypted_api_key", ""))
        
        # Remove encrypted fields from response
        for key in ["encrypted_username", "encrypted_password", "encrypted_api_key", 
                    "encrypted_cookies", "encrypted_session_data"]:
            decrypted.pop(key, None)
        
        return decrypted
    
    def _sanitize_credential(self, cred: Dict[str, Any]) -> Dict[str, Any]:
        """Return credential without sensitive data."""
        return {
            "id": cred["id"],
            "name": cred["name"],
            "source_id": cred["source_id"],
            "credential_type": cred["credential_type"],
            "has_username": bool(cred.get("encrypted_username")),
            "has_password": bool(cred.get("encrypted_password")),
            "has_api_key": bool(cred.get("encrypted_api_key")),
            "has_cookies": bool(cred.get("encrypted_cookies")),
            "last_used_at": cred.get("last_used_at", ""),
            "last_success_at": cred.get("last_success_at", ""),
            "is_valid": cred.get("is_valid", True),
            "notes": cred.get("notes", ""),
            "created_at": cred["created_at"],
            "updated_at": cred.get("updated_at", "")
        }
