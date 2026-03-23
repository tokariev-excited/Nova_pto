import Highlighter from "react-highlight-words"

interface HighlightTextProps {
  text: string
  query: string
}

function HighlightText({ text, query }: HighlightTextProps) {
  if (!query.trim()) return <>{text}</>

  return (
    <Highlighter
      searchWords={[query]}
      autoEscape
      textToHighlight={text}
      highlightClassName="bg-yellow-100 rounded-sm"
    />
  )
}

export { HighlightText }
