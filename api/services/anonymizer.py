"""Stub for DeepPrivacy2 face anonymization.

This module provides a pass-through interface that can be replaced
with a real DeepPrivacy2 integration in a future version.
"""

from __future__ import annotations


async def anonymize_frame(frame: bytes) -> bytes:
    """Anonymize faces in a JPEG frame.

    Currently a no-op stub. Replace with DeepPrivacy2 inference
    when GPU backend is available.
    """
    return frame
