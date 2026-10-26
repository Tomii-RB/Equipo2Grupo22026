"""Cliente de Supabase falso (en memoria) con los métodos que usa services.py."""
import re
from types import SimpleNamespace


class _Not:
    def __init__(self, q):
        self.q = q

    def in_(self, col, vals):
        self.q.filters.append(lambda r: r.get(col) not in vals)
        return self.q


class Query:
    def __init__(self, store, table):
        self.store, self.table = store, table
        self.filters, self.order_by, self.action, self.payload = [], None, "select", None

    # lecturas
    def select(self, *a, **k):
        return self

    def eq(self, col, val):
        self.filters.append(lambda r: r.get(col) == val)
        return self

    def in_(self, col, vals):
        self.filters.append(lambda r: r.get(col) in vals)
        return self

    def or_(self, expr):
        conds = [re.match(r"(\w+)\.ilike\.\*(.*)\*$", c).groups() for c in expr.split(",")]
        self.filters.append(lambda r: any(t in str(r.get(c) or "").lower() for c, t in conds))
        return self

    def order(self, col, desc=False):
        self.order_by = (col, desc)
        return self

    # escrituras
    def upsert(self, rows, on_conflict=None):
        self.action, self.payload, self.conflict = "upsert", rows, on_conflict.split(",")
        return self

    def delete(self):
        self.action = "delete"
        return self

    @property
    def not_(self):
        return _Not(self)

    def execute(self):
        data = self.store[self.table]
        if self.action == "upsert":
            for new in self.payload:
                for old in data:
                    if all(old.get(k) == new.get(k) for k in self.conflict):
                        old.update(new)
                        break
                else:
                    data.append(dict(new))
            return SimpleNamespace(data=self.payload)
        if self.action == "delete":
            keep = [r for r in data if not all(f(r) for f in self.filters)]
            self.store[self.table] = keep
            return SimpleNamespace(data=[])
        rows = [r for r in data if all(f(r) for f in self.filters)]
        if self.order_by:
            col, desc = self.order_by
            rows = sorted(rows, key=lambda r: (r.get(col) is None, r.get(col)), reverse=desc)
        return SimpleNamespace(data=[dict(r) for r in rows])


class FakeDB:
    def __init__(self, store):
        self.store = store

    def table(self, name):
        return Query(self.store, name)
