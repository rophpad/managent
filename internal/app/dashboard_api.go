package app

import (
	"encoding/json"
	"io"
	"net/http"
	"strings"
)

var dashboardCollections = map[string]string{
	"agents": "agent", "resources": "resource", "policies": "policy", "audit-entries": "audit-entry",
}

// handleDashboardEntities preserves the exact JSON discriminated unions
// defined by web/lib/types.ts instead of translating them to gateway records.
func (r *Runtime) handleDashboardEntities(w http.ResponseWriter, req *http.Request) {
	path := strings.Trim(strings.TrimPrefix(req.URL.Path, "/api/v1/dashboard/"), "/")
	parts := strings.Split(path, "/")
	kind, ok := dashboardCollections[parts[0]]
	if !ok || len(parts) > 2 {
		writeJSON(w, http.StatusNotFound, map[string]any{"error": "not found"})
		return
	}
	id := ""
	if len(parts) == 2 {
		id = parts[1]
	}

	switch req.Method {
	case http.MethodGet:
		if id == "" {
			items, err := r.db.ListDashboardEntities(req.Context(), r.workspace.ID, kind)
			if err != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
				return
			}
			writeJSON(w, http.StatusOK, items)
			return
		}
		item, err := r.db.GetDashboardEntity(req.Context(), r.workspace.ID, kind, id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			return
		}
		if item == nil {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "not found"})
			return
		}
		writeRawJSON(w, http.StatusOK, item)
	case http.MethodPost, http.MethodPut:
		body, err := io.ReadAll(http.MaxBytesReader(w, req.Body, 1<<20))
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid body"})
			return
		}
		var identity struct {
			ID string `json:"id"`
		}
		if err := json.Unmarshal(body, &identity); err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "invalid JSON"})
			return
		}
		if id == "" {
			id = identity.ID
		}
		if identity.ID == "" || identity.ID != id {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "body id must match path id"})
			return
		}
		item, err := r.db.PutDashboardEntity(req.Context(), r.workspace.ID, kind, id, body)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": err.Error()})
			return
		}
		status := http.StatusOK
		if req.Method == http.MethodPost {
			status = http.StatusCreated
		}
		if kind == "policy" {
			rules, loadErr := r.db.LoadPolicyRules(req.Context(), r.workspace.ID)
			if loadErr != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]any{"error": loadErr.Error()})
				return
			}
			r.policies.ReplaceRules(rules)
		}
		writeRawJSON(w, status, item)
	case http.MethodDelete:
		if id == "" {
			writeJSON(w, http.StatusBadRequest, map[string]any{"error": "id is required"})
			return
		}
		deleted, err := r.db.DeleteDashboardEntity(req.Context(), r.workspace.ID, kind, id)
		if err != nil {
			writeJSON(w, http.StatusInternalServerError, map[string]any{"error": err.Error()})
			if kind == "policy" {
				if rules, loadErr := r.db.LoadPolicyRules(req.Context(), r.workspace.ID); loadErr == nil {
					r.policies.ReplaceRules(rules)
				}
			}
			return
		}
		if !deleted {
			writeJSON(w, http.StatusNotFound, map[string]any{"error": "not found"})
			return
		}
		if kind == "policy" {
			rules, loadErr := r.db.LoadPolicyRules(req.Context(), r.workspace.ID)
			if loadErr != nil {
				writeJSON(w, http.StatusInternalServerError, map[string]any{"error": loadErr.Error()})
				return
			}
			r.policies.ReplaceRules(rules)
		}
		w.WriteHeader(http.StatusNoContent)
	default:
		w.Header().Set("Allow", "GET, POST, PUT, DELETE")
		writeJSON(w, http.StatusMethodNotAllowed, map[string]any{"error": "method not allowed"})
	}
}

func writeRawJSON(w http.ResponseWriter, status int, body []byte) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	_, _ = w.Write(body)
}
