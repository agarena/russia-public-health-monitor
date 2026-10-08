"""HTTP 客户端：统一 UA、超时与重试。合规采集，尊重 robots 与限速。"""
import httpx

USER_AGENT = (
    "russia-public-health-monitor/0.1 "
    "(single-event public information monitor; open-source; "
    "contact via repository issues)"
)


def make_client(timeout: float = 30.0) -> httpx.Client:
    return httpx.Client(
        headers={"User-Agent": USER_AGENT, "Accept-Language": "en,ru;q=0.8,zh;q=0.6"},
        timeout=timeout,
        follow_redirects=True,
    )
