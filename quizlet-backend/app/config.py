from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    database_url: str
    jwt_secret_key: str = "development-only-change-this-secret"
    jwt_access_token_minutes: int = 30
    cors_origins: str = "http://localhost:5173"
    llm_base_url: str = "http://localhost:11434"
    llm_chat_model: str = "llama3.2"
    llm_embedding_model: str = "nomic-embed-text"
    material_chunk_chars: int = 1200
    material_chunk_overlap: int = 180
    material_max_upload_bytes: int = 10_000_000

    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    @property
    def allowed_origins(self) -> list[str]:
        return [origin.strip() for origin in self.cors_origins.split(",") if origin.strip()]


settings = Settings()
