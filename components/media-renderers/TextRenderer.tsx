import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { CollapsibleContent } from "./CollapsibleContent";
import { useDebounce } from "@/hooks/useDebounce";
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

interface TextRendererProps {
  text: string;
  className?: string;
}

export const TextRenderer: React.FC<TextRendererProps> = ({
  text,
  className = "",
}) => {
  // Debounce text updates during streaming to improve performance
  const debouncedText = useDebounce(text, 100); // 100ms delay
  
  // Pre-process text to handle special link patterns and Playwright code
  const { processedText, playwrightSections } = React.useMemo(() => {
    // First, handle Playwright code sections
    const playwrightPattern = /Ran Playwright code:\s*```[\s\S]*?```/g;
    const sections: { start: number; end: number; content: string }[] = [];
    let match;

    while ((match = playwrightPattern.exec(debouncedText)) !== null) {
      sections.push({
        start: match.index,
        end: match.index + match[0].length,
        content: match[0],
      });
    }

    // Process the text, replacing Playwright sections with placeholders
    let processed = debouncedText;
    sections.reverse().forEach((section, index) => {
      const placeholder = `__PLAYWRIGHT_SECTION_${
        sections.length - 1 - index
      }__`;
      processed =
        processed.substring(0, section.start) +
        placeholder +
        processed.substring(section.end);
    });

    // Then handle link patterns
    processed = processed.replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      (match, linkText, url) => {
        // Check if it's a real URL or just a filename reference
        if (
          !url.startsWith("http") &&
          !url.startsWith("/") &&
          !url.startsWith("#") &&
          !url.includes("://")
        ) {
          // It's likely just a description, return only the text
          return linkText;
        }
        return match;
      }
    );

    return { processedText: processed, playwrightSections: sections.reverse() };
  }, [debouncedText]);

  // Memoize the markdown components to prevent recreation on every render
  const markdownComponents = React.useMemo(() => ({
    // Custom link renderer to open in new tab
    a: ({ href, children, ...props }: React.AnchorHTMLAttributes<HTMLAnchorElement> & { children?: React.ReactNode }) => {
      // Skip rendering links without valid hrefs
      if (!href || href === "#") {
        return <span className="text-gray-700">{children}</span>;
      }
      return (
        <a
          {...props}
          href={href}
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:underline"
        >
          {children}
        </a>
      );
    },
    // Custom code block styling
    code: ({ className, children, ...props }: React.HTMLAttributes<HTMLElement> & { children?: React.ReactNode }) => {
      const match = /language-(\w+)/.exec(className || "");
      const isInline = !match;

      if (isInline) {
        return (
          <code
            className="px-1 py-0.5 bg-gray-100 rounded text-sm"
            {...props}
          >
            {children}
          </code>
        );
      }

      // Check if the code block is large (more than 10 lines or 500 characters)
      const codeContent = String(children);
      const lineCount = codeContent.split("\n").length;
      const isLarge = lineCount > 10 || codeContent.length > 300;
      const language = match ? match[1] : "text";

      if (isLarge) {
        return (
          <CollapsibleContent
            title={`${language} code block (${lineCount} lines)`}
            className="my-2"
            defaultOpen={false}
          >
            <SyntaxHighlighter
              style={vscDarkPlus}
              language={language}
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              {codeContent}
            </SyntaxHighlighter>
          </CollapsibleContent>
        );
      }

      return (
        <SyntaxHighlighter
          style={vscDarkPlus}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            borderRadius: '0.5rem',
            fontSize: '0.875rem',
          }}
        >
          {codeContent}
        </SyntaxHighlighter>
      );
    },
    // Custom image styling
    img: ({ src, alt, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) => {
      // Don't render img if src is empty string
      if (!src || src === "") return null;

      return (
        <img
          src={src}
          alt={alt || ""}
          {...props}
          className="max-w-full h-auto rounded-lg shadow-md"
        />
      );
    },
  }), []);

  // Memoize the rendered content to prevent recreation on every render
  const renderedContent = React.useMemo(() => {
    const parts = processedText.split(/__PLAYWRIGHT_SECTION_\d+__/);
    const elements: React.ReactNode[] = [];

    parts.forEach((part, index) => {
      // Render the text part
      if (part.trim()) {
        elements.push(
          <ReactMarkdown
            key={`text-${index}`}
            remarkPlugins={[remarkGfm]}
            components={markdownComponents}
          >
            {part}
          </ReactMarkdown>
        );
      }

      // Add the Playwright section if it exists
      if (index < playwrightSections.length) {
        const section = playwrightSections[index];
        // Extract the code content from the section
        const codeMatch = section.content.match(/```([\s\S]*?)```/);
        const code = codeMatch ? codeMatch[1].trim() : section.content;

        elements.push(
          <CollapsibleContent
            key={`playwright-${index}`}
            title="Ran Playwright code"
            className="my-2"
          >
            <SyntaxHighlighter
              style={vscDarkPlus}
              language="javascript"
              PreTag="div"
              customStyle={{
                margin: 0,
                borderRadius: '0.5rem',
                fontSize: '0.875rem',
              }}
            >
              {code}
            </SyntaxHighlighter>
          </CollapsibleContent>
        );
      }
    });

    return elements;
  }, [processedText, playwrightSections, markdownComponents]);

  return (
    <div className={`prose prose-sm max-w-none ${className}`}>
      {renderedContent}
    </div>
  );
};
