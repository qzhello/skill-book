package scanner

import "testing"

func TestParseFrontmatter_NameAndDescription(t *testing.T) {
	content := "---\nname: foo-skill\ndescription: does foo\n---\n# Body\nhello\n"
	name, desc, err := ParseFrontmatter([]byte(content))
	if err != nil {
		t.Fatal(err)
	}
	if name != "foo-skill" {
		t.Fatalf("name=%q", name)
	}
	if desc != "does foo" {
		t.Fatalf("desc=%q", desc)
	}
}

func TestParseFrontmatter_NoFrontmatter(t *testing.T) {
	name, desc, err := ParseFrontmatter([]byte("# just a heading\n"))
	if err != nil {
		t.Fatal(err)
	}
	if name != "" || desc != "" {
		t.Fatalf("expected empties, got name=%q desc=%q", name, desc)
	}
}
