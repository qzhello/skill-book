package githubsrc

import "testing"

func TestParseURL(t *testing.T) {
	tests := []struct {
		name    string
		in      string
		owner   string
		repo    string
		ref     string
		subpath string
		wantErr bool
	}{
		{
			name:  "repo only",
			in:    "https://github.com/anthropics/skills",
			owner: "anthropics", repo: "skills",
		},
		{
			name:  "repo with .git suffix",
			in:    "https://github.com/anthropics/skills.git",
			owner: "anthropics", repo: "skills",
		},
		{
			name:  "trailing slash",
			in:    "https://github.com/anthropics/skills/",
			owner: "anthropics", repo: "skills",
		},
		{
			name:  "tree with ref and subpath",
			in:    "https://github.com/anthropics/skills/tree/main/foo/bar",
			owner: "anthropics", repo: "skills", ref: "main", subpath: "foo/bar",
		},
		{
			name:  "tree with ref only (repo root)",
			in:    "https://github.com/anthropics/skills/tree/dev",
			owner: "anthropics", repo: "skills", ref: "dev", subpath: "",
		},
		{
			name:  "blob points at file, subpath is dir",
			in:    "https://github.com/anthropics/skills/blob/main/foo/bar/SKILL.md",
			owner: "anthropics", repo: "skills", ref: "main", subpath: "foo/bar",
		},
		{
			name:  "blob at repo root file",
			in:    "https://github.com/anthropics/skills/blob/main/SKILL.md",
			owner: "anthropics", repo: "skills", ref: "main", subpath: "",
		},
		{
			name:  "ref with dot (tag)",
			in:    "https://github.com/o/r/tree/v1.2.3/sub",
			owner: "o", repo: "r", ref: "v1.2.3", subpath: "sub",
		},
		{name: "non-github host", in: "https://gitlab.com/o/r", wantErr: true},
		{name: "evil host with github in path", in: "https://evil.com/github.com/o/r", wantErr: true},
		{name: "http not https", in: "http://github.com/o/r", wantErr: true},
		{name: "missing repo", in: "https://github.com/onlyowner", wantErr: true},
		{name: "empty path", in: "https://github.com/", wantErr: true},
		{name: "dotdot in subpath", in: "https://github.com/o/r/tree/main/../etc", wantErr: true},
		{name: "space in subpath", in: "https://github.com/o/r/tree/main/a b", wantErr: true},
		{name: "shell meta in ref", in: "https://github.com/o/r/tree/ma;in/x", wantErr: true},
		{name: "unknown mode", in: "https://github.com/o/r/raw/main/x", wantErr: true},
		{name: "tree without ref", in: "https://github.com/o/r/tree", wantErr: true},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			owner, repo, ref, subpath, err := ParseURL(tc.in)
			if tc.wantErr {
				if err == nil {
					t.Fatalf("expected error, got owner=%q repo=%q ref=%q subpath=%q", owner, repo, ref, subpath)
				}
				return
			}
			if err != nil {
				t.Fatalf("unexpected error: %v", err)
			}
			if owner != tc.owner || repo != tc.repo || ref != tc.ref || subpath != tc.subpath {
				t.Fatalf("got (%q,%q,%q,%q) want (%q,%q,%q,%q)",
					owner, repo, ref, subpath, tc.owner, tc.repo, tc.ref, tc.subpath)
			}
		})
	}
}

func TestRawSkillURL(t *testing.T) {
	tests := []struct {
		owner, repo, ref, subpath, want string
	}{
		{"o", "r", "main", "foo/bar", "https://raw.githubusercontent.com/o/r/main/foo/bar/SKILL.md"},
		{"o", "r", "main", "", "https://raw.githubusercontent.com/o/r/main/SKILL.md"},
		{"o", "r", "", "sub", "https://raw.githubusercontent.com/o/r/HEAD/sub/SKILL.md"},
	}
	for _, tc := range tests {
		got := RawSkillURL(tc.owner, tc.repo, tc.ref, tc.subpath)
		if got != tc.want {
			t.Errorf("RawSkillURL(%q,%q,%q,%q)=%q want %q", tc.owner, tc.repo, tc.ref, tc.subpath, got, tc.want)
		}
	}
}

func TestCloneURL(t *testing.T) {
	if got := CloneURL("anthropics", "skills"); got != "https://github.com/anthropics/skills" {
		t.Errorf("CloneURL=%q", got)
	}
}
