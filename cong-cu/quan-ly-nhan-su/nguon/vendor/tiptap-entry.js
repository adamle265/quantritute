// Nguồn đóng gói vendor/tiptap.iife.js (biến toàn cục TT). Dựng lại: npm i @tiptap/core@3.32.0 @tiptap/pm@3.32.0 @tiptap/starter-kit@3.32.0 @tiptap/extension-text-align@3.32.0 @tiptap/extension-text-style@3.32.0 @tiptap/extension-table@3.32.0 @tiptap/suggestion@3.32.0 esbuild@0.24.0
//   rồi: npx esbuild tiptap-entry.js --bundle --minify --format=iife --global-name=TT --target=es2018 --legal-comments=none --outfile=tiptap.iife.js (thêm lại phần giấy phép ở đầu file)
export { Editor, Extension, Node, Mark, mergeAttributes, nodeInputRule, nodePasteRule } from '@tiptap/core';
export { Document } from '@tiptap/extension-document';
export { Paragraph } from '@tiptap/extension-paragraph';
export { Text } from '@tiptap/extension-text';
export { Bold } from '@tiptap/extension-bold';
export { Italic } from '@tiptap/extension-italic';
export { Underline } from '@tiptap/extension-underline';
export { Heading } from '@tiptap/extension-heading';
export { HardBreak } from '@tiptap/extension-hard-break';
export { BulletList, OrderedList, ListItem, ListKeymap } from '@tiptap/extension-list';
export { Dropcursor, Gapcursor, UndoRedo, Placeholder } from '@tiptap/extensions';
export { TextAlign } from '@tiptap/extension-text-align';
export { TextStyle, FontSize, LineHeight } from '@tiptap/extension-text-style';
export { Table, TableRow, TableCell, TableHeader } from '@tiptap/extension-table';
export { Suggestion } from '@tiptap/suggestion';
export { Plugin, PluginKey, TextSelection, NodeSelection } from '@tiptap/pm/state';
export { Decoration, DecorationSet } from '@tiptap/pm/view';
export { DOMSerializer, DOMParser as PMDOMParser } from '@tiptap/pm/model';
