"use client";

import { useEditor, EditorContent } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import StarterKit from '@tiptap/starter-kit';
import Underline from '@tiptap/extension-underline';
import Highlight from '@tiptap/extension-highlight';
import TextAlign from '@tiptap/extension-text-align';
import Link from '@tiptap/extension-link';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import TaskItem from '@tiptap/extension-task-item';
import TaskList from '@tiptap/extension-task-list';

import { useState, useEffect } from 'react';
import { marked } from 'marked';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Bold, Italic, Strikethrough, Underline as UnderlineIcon, 
  List, ListOrdered, CheckSquare, Quote, Code, 
  AlignLeft, AlignCenter, AlignRight, AlignJustify,
  Heading1, Heading2, Heading3, Undo, Redo, Sparkles, X, Highlighter,
  Wand2, SpellCheck, ArrowDownToLine, ArrowUpFromLine
} from 'lucide-react';

interface StrategyEditorProps {
  initialContent: string;
  onChange: (content: string) => void;
  onBlur?: () => void;
  minHeight?: string | number;
}

const editorExtensions = [
  StarterKit.configure({
    heading: { levels: [1, 2, 3] },
  }),
  Underline,
  Highlight.configure({ multicolor: true }),
  TextAlign.configure({ types: ['heading', 'paragraph'] }),
  Link.configure({ openOnClick: false }),
  Color,
  TextStyle,
  TaskList,
  TaskItem.configure({ nested: true }),
  Placeholder.configure({
    placeholder: "Type your overarching strategy notes here... Use the toolbar above or the AI assistant.",
  }),
];

export function StrategyEditor({ initialContent, onChange, onBlur, minHeight }: StrategyEditorProps) {
  const [isAIPromptOpen, setIsAIPromptOpen] = useState(false);
  const [aiPrompt, setAiPrompt] = useState("");
  const [aiModel, setAiModel] = useState("gemini-1.5-flash-latest");
  const [isGenerating, setIsGenerating] = useState(false);

  const editor = useEditor({
    immediatelyRender: false,
    extensions: editorExtensions,
    content: initialContent,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    onBlur: () => {
      if (onBlur) onBlur();
    }
  });

  // Re-sync if initialContent changes completely (optional but safe)
  useEffect(() => {
    if (editor && initialContent !== editor.getHTML() && initialContent && !editor.isFocused) {
      // Un-comment to force full re-sync, but usually we just want the first load to be correct
      // editor.commands.setContent(initialContent);
    }
  }, [initialContent, editor]);

  if (!editor) {
    return <div className="p-4" style={{ color: 'var(--muted)' }}>Loading editor...</div>;
  }

  const handleAskAI = async (e?: React.FormEvent | React.MouseEvent | React.KeyboardEvent) => {
    if (e) e.preventDefault();
    if (!aiPrompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const currentText = editor.getText();
      const promptContext = `Current context of notes:\\n${currentText.slice(0, 1000)}\\n\\nUser Request: ${aiPrompt}`;

      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptContext, model: aiModel })
      });

      const data = await res.json();
      if (data.result) {
        const htmlPayload = await marked.parse(data.result);
        editor.chain().focus().insertContent(htmlPayload).run();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to generate AI response.");
    } finally {
      setIsGenerating(false);
      setIsAIPromptOpen(false);
      setAiPrompt("");
    }
  };

  const handleBubbleAction = async (action: string) => {
    const { from, to } = editor.state.selection;
    const selectedText = editor.state.doc.textBetween(from, to, ' ');
    if (!selectedText.trim()) return;

    setIsGenerating(true);
    try {
      const promptContext = `You are a writing assistant integrating directly into a text editor. Execute the following command on the text below: "${action}". Return ONLY the requested text, without any conversational filler or formatting wrapping (do not use \`\`\`markdown). \n\nText:\n"${selectedText}"`;
      
      const res = await fetch("/api/gemini", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: promptContext, model: aiModel })
      });

      const data = await res.json();
      if (data.result) {
        const htmlPayload = await marked.parse(data.result);
        editor.chain().focus().insertContent(htmlPayload).run();
      }
    } catch (err) {
      console.error(err);
      alert("Failed to perform AI action.");
    } finally {
      setIsGenerating(false);
    }
  };

  const ToolbarButton = ({ onClick, isActive, icon: Icon, disabled = false }: any) => (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`btn btn-sm ${isActive ? 'active-tool' : ''}`}
      style={{ 
        padding: '6px', 
        background: isActive ? 'var(--accent)' : 'transparent', 
        color: isActive ? '#fff' : 'var(--muted)',
        border: 'none',
        opacity: disabled ? 0.4 : 1,
        borderRadius: '6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transition: 'all 0.2s ease',
        cursor: disabled ? 'not-allowed' : 'pointer'
      }}
      type="button"
      onMouseEnter={(e) => !isActive && !disabled && (e.currentTarget.style.background = 'var(--surface2)')}
      onMouseLeave={(e) => !isActive && !disabled && (e.currentTarget.style.background = 'transparent')}
    >
      <Icon size={16} />
    </button>
  );

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', gap: '12px' }}>
      
      {/* TOOLBAR */}
      <div 
        style={{ 
          display: 'flex', 
          gap: '4px', 
          flexWrap: 'wrap', 
          background: 'var(--surface)', 
          padding: '8px', 
          borderRadius: '12px',
          border: '1px solid var(--border)',
          alignItems: 'center',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}
      >
        <button
          onClick={() => setIsAIPromptOpen(!isAIPromptOpen)}
          type="button"
          style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '6px', 
            background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', 
            color: 'white', 
            padding: '6px 12px', 
            borderRadius: '8px',
            border: 'none',
            fontWeight: 600,
            fontSize: '13px',
            cursor: 'pointer',
            boxShadow: '0 2px 10px rgba(168, 85, 247, 0.3)',
            marginRight: '8px',
            transition: 'transform 0.2s ease'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.transform = 'scale(1.02)')}
          onMouseLeave={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          <Sparkles size={14} /> Ask AI
        </button>

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBold().run()} isActive={editor.isActive('bold')} icon={Bold} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleItalic().run()} isActive={editor.isActive('italic')} icon={Italic} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleUnderline().run()} isActive={editor.isActive('underline')} icon={UnderlineIcon} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleStrike().run()} isActive={editor.isActive('strike')} icon={Strikethrough} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHighlight().run()} isActive={editor.isActive('highlight')} icon={Highlighter} />
        
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()} isActive={editor.isActive('heading', { level: 1 })} icon={Heading1} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} isActive={editor.isActive('heading', { level: 2 })} icon={Heading2} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()} isActive={editor.isActive('heading', { level: 3 })} icon={Heading3} />

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('left').run()} isActive={editor.isActive({ textAlign: 'left' })} icon={AlignLeft} />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('center').run()} isActive={editor.isActive({ textAlign: 'center' })} icon={AlignCenter} />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('right').run()} isActive={editor.isActive({ textAlign: 'right' })} icon={AlignRight} />
        <ToolbarButton onClick={() => editor.chain().focus().setTextAlign('justify').run()} isActive={editor.isActive({ textAlign: 'justify' })} icon={AlignJustify} />

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />

        <ToolbarButton onClick={() => editor.chain().focus().toggleBulletList().run()} isActive={editor.isActive('bulletList')} icon={List} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleOrderedList().run()} isActive={editor.isActive('orderedList')} icon={ListOrdered} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleTaskList().run()} isActive={editor.isActive('taskList')} icon={CheckSquare} />
        
        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
        
        <ToolbarButton onClick={() => editor.chain().focus().toggleBlockquote().run()} isActive={editor.isActive('blockquote')} icon={Quote} />
        <ToolbarButton onClick={() => editor.chain().focus().toggleCodeBlock().run()} isActive={editor.isActive('codeBlock')} icon={Code} />

        <div style={{ width: '1px', height: '20px', background: 'var(--border)', margin: '0 4px' }} />
        
        <ToolbarButton onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} icon={Undo} />
        <ToolbarButton onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} icon={Redo} />
      </div>

      {/* AI PROMPT DROPDOWN */}
      <AnimatePresence>
        {isAIPromptOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.98 }}
            style={{ 
              background: 'var(--surface)', 
              borderRadius: '12px', 
              padding: '16px', 
              border: '1px solid #c084fc', // light purple border
              boxShadow: '0 6px 24px rgba(168, 85, 247, 0.15)',
              position: 'relative'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Sparkles size={14} color="#a855f7" /> Tell Gemini what to accomplish
              </div>
              <button 
                onClick={() => setIsAIPromptOpen(false)}
                style={{ background: 'var(--surface2)', borderRadius: '50%', padding: '4px', border: 'none', color: 'var(--muted)', cursor: 'pointer' }}
              >
                <X size={14} />
              </button>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select
                className="form-input"
                style={{ fontSize: '14px', padding: '10px', borderColor: 'var(--border)', minWidth: '150px', borderRadius: '8px' }}
                value={aiModel}
                onChange={e => setAiModel(e.target.value)}
                disabled={isGenerating}
              >
                <option value="gemini-3.1-pro">Gemini 3.1 Pro (Advanced)</option>
                <option value="gemini-3.0-pro">Gemini 3.0 Pro</option>
                <option value="gemini-2.5-pro">Gemini 2.5 Pro</option>
                <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                <option value="gemini-1.5-pro-latest">Gemini 1.5 Pro (Latest)</option>
                <option value="gemini-1.5-flash-latest">Gemini 1.5 Flash (Latest)</option>
                <option value="gemini-1.0-pro">Gemini 1.0 Pro</option>
                <option value="gemini-pro">Gemini Pro</option>
              </select>
              <input 
                type="text" 
                autoFocus
                disabled={isGenerating}
                placeholder="e.g. Write a 3-point strategy for next week's YouTube video..."
                className="form-input"
                style={{ flex: 1, fontSize: '14px', padding: '10px 14px', borderColor: 'var(--border)' }}
                value={aiPrompt}
                onChange={e => setAiPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAskAI(e);
                  }
                }}
              />
              <button 
                type="button" 
                onClick={handleAskAI}
                className="btn btn-primary"
                disabled={isGenerating || !aiPrompt.trim()}
                style={{ 
                  background: 'linear-gradient(135deg, #a855f7 0%, #3b82f6 100%)', 
                  border: 'none', 
                  padding: '0 20px',
                  fontWeight: 600,
                  opacity: (isGenerating || !aiPrompt.trim()) ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px'
                }}
              >
                {isGenerating ? "Generating..." : "Generate ✨"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TIPTAP EDITOR WRAPPER */}
      <div 
        className="tiptap-wrapper" 
        style={{ 
          flex: 1, 
          background: 'var(--surface)', 
          borderRadius: '12px', 
          border: '1px solid var(--border)',
          overflowY: 'auto',
          padding: '24px',
          minHeight: minHeight || '300px',
          cursor: 'text',
          boxShadow: 'inset 0 2px 4px rgba(0,0,0,0.02)'
        }}
        onClick={() => {
          if (editor && !editor.isFocused) {
            editor.commands.focus();
          }
        }}
      >
        <EditorContent editor={editor} />
        
        {editor && (
          <BubbleMenu editor={editor} className="bubble-menu">
            <div style={{ display: 'flex', gap: '4px', background: 'var(--surface)', padding: '6px', borderRadius: '8px', border: '1px solid #c084fc', boxShadow: '0 4px 16px rgba(168, 85, 247, 0.2)' }}>
              <button 
                onClick={() => handleBubbleAction("Improve and refine the writing to sound more professional.")} 
                className="btn btn-sm" 
                disabled={isGenerating}
                style={{ background: 'transparent', color: 'var(--text)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <Wand2 size={14} color="#a855f7" /> Improve
              </button>
              <div style={{ width: '1px', background: 'var(--border)' }}></div>
              <button 
                onClick={() => handleBubbleAction("Fix any spelling or grammatical errors.")} 
                className="btn btn-sm" 
                disabled={isGenerating}
                style={{ background: 'transparent', color: 'var(--text)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <SpellCheck size={14} /> Fix Grammar
              </button>
              <div style={{ width: '1px', background: 'var(--border)' }}></div>
              <button 
                onClick={() => handleBubbleAction("Make this text significantly shorter and more concise.")} 
                className="btn btn-sm" 
                disabled={isGenerating}
                style={{ background: 'transparent', color: 'var(--text)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <ArrowDownToLine size={14} /> Shorter
              </button>
              <div style={{ width: '1px', background: 'var(--border)' }}></div>
              <button 
                onClick={() => handleBubbleAction("Expand upon this text, adding more detail and making it longer.")} 
                className="btn btn-sm"
                disabled={isGenerating} 
                style={{ background: 'transparent', color: 'var(--text)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', fontWeight: 600, padding: '4px 8px', borderRadius: '4px' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = 'var(--surface2)')}
                onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
              >
                <ArrowUpFromLine size={14} /> Longer
              </button>
            </div>
          </BubbleMenu>
        )}
      </div>
    </div>
  );
}
