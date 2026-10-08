"""冒烟测试：确保两个 Python 包可导入。"""


def test_packages_importable():
    import collector  # noqa: F401
    import processor  # noqa: F401
