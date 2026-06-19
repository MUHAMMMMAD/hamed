"""تهيئة مشتركة للاختبارات."""
import pytest

from masarat.database import load_sample_tender


@pytest.fixture
def sample_tender():
    return load_sample_tender()
