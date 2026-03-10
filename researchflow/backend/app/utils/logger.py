import logging
import os
import sys

_log_level = os.getenv("LOG_LEVEL", "INFO").upper()

logger = logging.getLogger("researchflow")
logger.setLevel(getattr(logging, _log_level, logging.INFO))

if not logger.handlers:
    _handler = logging.StreamHandler(sys.stdout)
    _handler.setLevel(getattr(logging, _log_level, logging.INFO))
    _formatter = logging.Formatter(
        "%(asctime)s | %(levelname)-8s | %(name)s | %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    _handler.setFormatter(_formatter)
    logger.addHandler(_handler)
