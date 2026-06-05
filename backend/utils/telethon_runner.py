import asyncio
import sys


def run_telethon(coro):
    """Run a Telethon coroutine safely on Windows (avoids asyncio.run ProactorEventLoop issue)."""
    if sys.platform == "win32":
        loop = asyncio.SelectorEventLoop()
        asyncio.set_event_loop(loop)
        try:
            return loop.run_until_complete(coro)
        finally:
            loop.close()
    else:
        return asyncio.run(coro)
