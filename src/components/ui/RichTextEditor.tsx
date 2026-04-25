import * as React from 'react';
import { useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Image from '@tiptap/extension-image';
import Color from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Placeholder from '@tiptap/extension-placeholder';
import Highlight from '@tiptap/extension-highlight';
import { Button } from './button';
import { 
  Bold, 
  Italic, 
  List, 
  ListOrdered, 
  Image as ImageIcon, 
  Type, 
  Undo, 
  Redo,
  Strikethrough,
  Code,
  Highlighter
} from 'lucide-react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

const MenuBar = ({ editor }: { editor: any }) => {
  if (!editor) {
    return null;
  }

  const addImage = () => {
    const url = window.prompt('Enter Image URL');
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const onImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64 = event.target?.result as string;
        editor.chain().focus().setImage({ src: base64 }).run();
      };
      reader.readAsDataURL(file);
    }
  };

  return (
    <div className="flex flex-wrap gap-1 p-2 border-b border-white/10 bg-[#0A0A0A] sticky top-0 z-10">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBold().run()}
        disabled={!editor.can().chain().focus().toggleBold().run()}
        className={editor.isActive('bold') ? 'bg-white/20 text-white' : 'text-gray-400'}
      >
        <Bold className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        disabled={!editor.can().chain().focus().toggleItalic().run()}
        className={editor.isActive('italic') ? 'bg-white/20 text-white' : 'text-gray-400'}
      >
        <Italic className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        disabled={!editor.can().chain().focus().toggleStrike().run()}
        className={editor.isActive('strike') ? 'bg-white/20 text-white' : 'text-gray-400'}
      >
        <Strikethrough className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleCode().run()}
        disabled={!editor.can().chain().focus().toggleCode().run()}
        className={editor.isActive('code') ? 'bg-white/20 text-white' : 'text-gray-400'}
      >
        <Code className="w-4 h-4" />
      </Button>
      <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={editor.isActive('bulletList') ? 'bg-white/20 text-white' : 'text-gray-400'}
      >
        <List className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={editor.isActive('orderedList') ? 'bg-white/20 text-white' : 'text-gray-400'}
      >
        <ListOrdered className="w-4 h-4" />
      </Button>
      <div className="w-[1px] h-6 bg-white/10 mx-1 self-center" />
      
      <div className="relative group">
        <Button variant="ghost" size="sm" className="text-gray-400">
          <ImageIcon className="w-4 h-4" />
          <input 
            type="file" 
            accept="image/*" 
            onChange={onImageUpload}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
        </Button>
      </div>

      <div className="flex items-center gap-1 mx-1 border border-white/5 bg-white/5 px-1 rounded">
        <input
          type="color"
          onInput={event => editor.chain().focus().setColor((event.target as HTMLInputElement).value).run()}
          value={editor.getAttributes('textStyle').color || '#ffffff'}
          className="w-5 h-5 p-0 border-0 bg-transparent cursor-pointer rounded"
          title="Text Color"
        />
        <Type className="w-3.5 h-3.5 text-gray-500" />
      </div>

      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().toggleHighlight().run()}
        className={editor.isActive('highlight') ? 'bg-white/20 text-white' : 'text-gray-400'}
      >
        <Highlighter className="w-4 h-4" />
      </Button>

      <div className="flex-1" />
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().chain().focus().undo().run()}
        className="text-gray-400"
      >
        <Undo className="w-4 h-4" />
      </Button>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().chain().focus().redo().run()}
        className="text-gray-400"
      >
        <Redo className="w-4 h-4" />
      </Button>
    </div>
  );
};

export function RichTextEditor({ value, onChange, placeholder }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Image.configure({
        allowBase64: true,
      }),
      TextStyle,
      Color,
      Highlight.configure({ multicolor: true }),
      Placeholder.configure({
        placeholder: placeholder || 'Write something...',
      }),
    ],
    content: value,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: 'prose prose-invert prose-sm max-w-none min-h-[200px] p-4 focus:outline-none focus:ring-1 focus:ring-gold/20',
      },
    },
  });

  return (
    <div className="border border-white/10 rounded-lg overflow-hidden bg-black/40 focus-within:border-gold/30 transition-all">
      <MenuBar editor={editor} />
      <EditorContent editor={editor} />
    </div>
  );
}
