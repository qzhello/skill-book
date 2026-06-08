package backup

import "testing"

func TestWithinDir(t *testing.T) {
	base := "/home/u/.skillbook/backup"
	ok := []string{base, base + "/claude", base + "/claude/SKILL.md"}
	bad := []string{"/home/u/.ssh", base + "/../escape", "/etc/passwd"}
	for _, p := range ok {
		if !withinDir(base, p) {
			t.Fatalf("%q 应在 base 内", p)
		}
	}
	for _, p := range bad {
		if withinDir(base, p) {
			t.Fatalf("%q 应在 base 外", p)
		}
	}
}
