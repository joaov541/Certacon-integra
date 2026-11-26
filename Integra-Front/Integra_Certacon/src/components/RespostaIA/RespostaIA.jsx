import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

import "./RespostaIA.css";

export default function RespostaIA({ texto }) {

    if (!texto) return null;

    return (
        <div className="resposta-ia">

            <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                skipHtml={true}
                components={{
                    a: ({ children }) => (
                        <span>{children}</span>
                    ),
                    img: () => null,
                    input: () => null
                }}
            >
                {String(texto)}
            </ReactMarkdown>

        </div>
    );
}