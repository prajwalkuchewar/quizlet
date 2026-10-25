from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str = Field(min_length=32)
    jwt_access_token_minutes: int = 30
    cors_origins: str = "http://localhost:5173"
    llm_base_url: str = "http://localhost:11434"
    llm_chat_model: str = "llama3.2"
    llm_embedding_model: str = "nomic-embed-text"
    llm_request_timeout_seconds: int = 180
    llm_max_concurrency: int = Field(default=1, ge=1)
    llm_circuit_failure_threshold: int = 3
    llm_circuit_reset_seconds: int = 60
    rate_limit_login_per_minute: int = 10
    rate_limit_signup_per_minute: int = 5
    rate_limit_llm_per_minute: int = 20
    rate_limit_upload_per_minute: int = 10
    material_chunk_chars: int = 1200
    material_chunk_overlap: int = 180
    material_max_upload_bytes: int = 10_000_000

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
