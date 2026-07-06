import html.parser

class HTMLFilter(html.parser.HTMLParser):
    def __init__(self):
        super().__init__()
        self.text = []
        self.in_script = False
        self.in_style = False

    def handle_starttag(self, tag, attrs):
        if tag == 'script':
            self.in_script = True
        elif tag == 'style':
            self.in_style = True

    def handle_endtag(self, tag):
        if tag == 'script':
            self.in_script = False
        elif tag == 'style':
            self.in_style = False

    def handle_data(self, data):
        if not self.in_script and not self.in_style:
            text = data.strip()
            if text:
                self.text.append(text)

with open(r'c:\Users\asus\Downloads\GuildHouse\AMD Developer Hackathon_ ACT II AI Hackathon _ lablab.ai.html', 'r', encoding='utf-8') as f:
    html_content = f.read()

f = HTMLFilter()
f.feed(html_content)
with open(r'c:\Users\asus\Downloads\GuildHouse\extracted_text.txt', 'w', encoding='utf-8') as f2:
    f2.write('\n'.join(f.text))
