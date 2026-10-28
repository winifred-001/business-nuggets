"use client";
import { useState } from "react";
/** Selection belongs to one filter scope; hidden/stale items never enter an action. */
export function useBulkSelection(scope: string, visibleIds: string[]) {
  const [state, setState] = useState<{ scope: string; ids: string[] }>({
    scope,
    ids: [],
  });
  if (state.scope !== scope) setState({ scope, ids: [] });
  const visible = new Set(visibleIds);
  const ids =
    state.scope === scope ? state.ids.filter((id) => visible.has(id)) : [];
  const selected = new Set(ids);
  return {
    ids,
    selected,
    all: visibleIds.length > 0 && ids.length === visibleIds.length,
    toggle: (id: string) =>
      setState((current) => {
        const next = new Set(
          current.scope === scope
            ? current.ids.filter((value) => visible.has(value))
            : [],
        );
        if (next.has(id)) next.delete(id);
        else if (visible.has(id)) next.add(id);
        return { scope, ids: [...next] };
      }),
    toggleGroup: (groupIds: string[]) =>
      setState((current) => {
        const next = new Set(
          current.scope === scope
            ? current.ids.filter((id) => visible.has(id))
            : [],
        );
        const group = groupIds.filter((id) => visible.has(id));
        const allSelected = group.length > 0 && group.every((id) => next.has(id));
        for (const id of group) {
          if (allSelected) next.delete(id);
          else next.add(id);
        }
        return { scope, ids: [...next] };
      }),
    toggleAll: () =>
      setState({
        scope,
        ids: ids.length === visibleIds.length ? [] : [...visibleIds],
      }),
    clear: () => setState({ scope, ids: [] }),
  };
}
