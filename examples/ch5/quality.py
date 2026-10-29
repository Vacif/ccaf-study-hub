"""Đo chất lượng trích xuất theo nhóm và lấy mẫu phân tầng cho người kiểm tra."""
import random
from collections import defaultdict


def accuracy_by(rows: list[dict], key: str) -> dict:
    """rows: kết quả đã được người kiểm tra, mỗi dòng có doc_type, field, confidence, correct."""
    tally = defaultdict(lambda: [0, 0])
    for r in rows:
        tally[r[key]][0] += r["correct"]
        tally[r[key]][1] += 1
    return {k: (ok / n, n) for k, (ok, n) in tally.items()}


def calibration(rows: list[dict], bins=(0.0, 0.5, 0.8, 0.9, 0.95, 1.01)) -> list:
    """Model báo tự tin 0,95 thì thực tế đúng bao nhiêu? Con số chỉ dùng được khi hai cột gần nhau."""
    out = []
    for lo, hi in zip(bins, bins[1:]):
        group = [r for r in rows if lo <= r["confidence"] < hi]
        if group:
            out.append((f"{lo:.2f}–{min(hi, 1):.2f}", sum(r["correct"] for r in group) / len(group), len(group)))
    return out


def stratified_sample(docs: list[dict], total: int, min_per_group: int = 30, seed: int = 0) -> list[dict]:
    """Mỗi loại tài liệu lấy ít nhất min_per_group mẫu (nhóm hiếm cũng đủ để kết luận),
    phần còn lại chia theo tỷ lệ; luôn có cả mẫu tự tin cao để bắt lỗi “tự tin nhưng sai”."""
    rng = random.Random(seed)
    groups = defaultdict(list)
    for d in docs:
        groups[d["doc_type"]].append(d)
    sample = []
    for items in groups.values():
        sample += rng.sample(items, min(min_per_group, len(items)))
    chosen = {id(d) for d in sample}
    rest = [d for d in docs if id(d) not in chosen]
    sample += rng.sample(rest, max(0, min(total - len(sample), len(rest))))
    return sample


if __name__ == "__main__":
    rng = random.Random(1)
    types_ = ["hoa_don"] * 90 + ["hop_dong"] * 8 + ["hop_dong_nuoc_ngoai"] * 2
    rows = []
    for i in range(2000):
        t = rng.choice(types_)
        conf = rng.uniform(0.85, 1.0)
        p_ok = {"hoa_don": 0.99, "hop_dong": 0.95, "hop_dong_nuoc_ngoai": 0.6}[t]
        rows.append({"doc_type": t, "field": rng.choice(["ngay", "tong_tien", "ma_so_thue"]), "confidence": conf, "correct": rng.random() < p_ok})
    print("Tổng:", round(sum(r["correct"] for r in rows) / len(rows), 3))
    for k, (acc, n) in sorted(accuracy_by(rows, "doc_type").items()):
        print(f"  {k:22} {acc:.1%}  ({n} mẫu)")
    for rng_label, acc, n in calibration(rows):
        print(f"  tự tin {rng_label}: đúng thực tế {acc:.1%} ({n})")
    s = stratified_sample(rows, total=300)
    print("Mẫu phân tầng:", dict(sorted((t, sum(1 for r in s if r["doc_type"] == t)) for t in set(types_))))
