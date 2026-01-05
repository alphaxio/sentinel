"""
Application Configuration
"""
from pydantic_settings import BaseSettings
from typing import List


class Settings(BaseSettings):
    # Application
    APP_NAME: str = "Sentinel IRM Platform"
    DEBUG: bool = False
    
    # Database (using local PostgreSQL via DBngin - default user is usually 'postgres')
    DATABASE_URL: str = "postgresql://postgres@localhost:5432/sentinel"
    
    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"
    
    # Celery
    CELERY_BROKER_URL: str = "amqp://guest:guest@localhost:5672//"
    
    # OPA
    OPA_URL: str = "http://localhost:8181"
    
    # JWT
    JWT_SECRET_KEY: str = "change-this-secret-key-in-production"
    JWT_ALGORITHM: str = "HS256"
    JWT_EXPIRATION_HOURS: int = 8
    
    # OAuth2/OIDC
    OAUTH2_CLIENT_ID: str = ""
    OAUTH2_CLIENT_SECRET: str = ""
    OAUTH2_AUTHORIZATION_URL: str = ""
    OAUTH2_TOKEN_URL: str = ""
    OAUTH2_USERINFO_URL: str = ""  # OIDC userinfo endpoint
    OAUTH2_REDIRECT_URI: str = "http://localhost:8080/auth/callback"
    OAUTH2_SCOPE: str = "openid profile email"
    OAUTH2_ENABLED: bool = False  # Enable OAuth2 when credentials are configured
    
    # AWS (for S3 reports)
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET: str = "sentinel-reports"
    AWS_REGION: str = "us-east-1"
    
    # CORS - Allow environment variable or default
    CORS_ORIGINS: str = "http://localhost:3000,http://localhost:8080"
    
    # Server
    PORT: int = 8000
    
    @property
    def cors_origins_list(self) -> List[str]:
        """Parse CORS_ORIGINS from comma-separated string or JSON array"""
        import json
        import os
        cors_env = os.getenv("CORS_ORIGINS", self.CORS_ORIGINS)
        try:
            # Try parsing as JSON array
            return json.loads(cors_env)
        except (json.JSONDecodeError, TypeError):
            # Fall back to comma-separated string
            return [origin.strip() for origin in cors_env.split(",") if origin.strip()]
    
    model_config = {
        "env_file": ".env",
        "case_sensitive": True
    }


settings = Settings()

