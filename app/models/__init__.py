import copy
from app.models.default_data import (
    YEARS, dashboardData as fallbackData, quadStatus as fallbackQuadStatus,
    anualStatus as fallbackAnualStatus, formulas, integrityPairs, yearColors
)
from app.models.excel_provider import get_dashboard_data as _excel_data

_use_live = True
_dashboard_cache = None

def get_dashboard_data(force_reload=False):
    global _dashboard_cache
    if force_reload:
        _dashboard_cache = None
    if _dashboard_cache is not None:
        return _dashboard_cache

    if _use_live:
        try:
            live = _excel_data()
            if live:
                _dashboard_cache = live
                return _dashboard_cache
        except Exception:
            pass

    _dashboard_cache = _build_fallback()
    return _dashboard_cache

def _build_fallback():
    return {
        "YEARS": YEARS,
        "dashboardData": copy.deepcopy(fallbackData),
        "quadStatus": copy.deepcopy(fallbackQuadStatus),
        "anualStatus": copy.deepcopy(fallbackAnualStatus),
        "integrityPairs": integrityPairs,
        "yearColors": yearColors,
    }
