"""OpenAI 兼容 AI 客户端（翻译 / 摘要 / 去重辅助 / 分类建议）。

配置经环境变量：AI_BASE_URL / AI_API_KEY / AI_MODEL（见 .env.example）。
未配置时 available() 为 False，调用方必须跳过 AI 步骤而不是报错。
密钥只从环境读取，绝不写入任何数据文件或前端。
"""
import json
import os

import httpx


class AINotConfigured(RuntimeError):
    pass


class AIClient:
    def __init__(self, base_url: str, api_key: str, model: str, timeout: float = 120.0):
        self.base_url = base_url.rstrip("/")
        self.api_key = api_key
        self.model = model
        self.timeout = timeout

    @classmethod
    def from_env(cls) -> "AIClient":
        return cls(
            base_url=os.environ.get("AI_BASE_URL", ""),
            api_key=os.environ.get("AI_API_KEY", ""),
            model=os.environ.get("AI_MODEL", ""),
        )

    def available(self) -> bool:
        return bool(self.base_url and self.api_key and self.model)

    def chat_json(self, system: str, user: str) -> dict:
        """一次对话，返回解析后的 JSON 对象。失败抛异常，由调用方降级。"""
        if not self.available():
            raise AINotConfigured("AI_BASE_URL / AI_API_KEY / AI_MODEL 未配置")
        resp = httpx.post(
            f"{self.base_url}/chat/completions",
            headers={"Authorization": f"Bearer {self.api_key}"},
            json={
                "model": self.model,
                "messages": [
                    {"role": "system", "content": system},
                    {"role": "user", "content": user},
                ],
                "temperature": 0.1,
                "response_format": {"type": "json_object"},
            },
            timeout=self.timeout,
        )
        resp.raise_for_status()
        content = resp.json()["choices"][0]["message"]["content"]
        return json.loads(content)
