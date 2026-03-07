import type { TaskStatus } from "./status.js";

export interface ParsedDocument {
  nodes: Map<string, ParsedTaskNode>; // ID → Node の高速ルックアップ
  rootIds: string[]; // ルートノード（depth=1）のIDリスト
}

export interface ParsedTaskNode {
  id: string; // 安定的な識別子（例: "1-2-3"）
  depth: number; // '*' の数（階層レベル）
  title: string; // タスク名（ステータスタグを除く）
  rawTag: string | null; // 原文のタグ文字列（null = タグなし）
  status: TaskStatus; // 正規化済みステータス（タグなし→"TODO"）

  // 構造情報
  parentId: string | null; // 親タスクのID（ルートはnull）
  childrenIds: string[]; // 子タスクのIDリスト

  // 位置情報（デバッグ・マッチング用）
  lineIndex: number; // 原文での行番号（0-based）
  path: string[]; // ルートからのタイトルパス（例: ["プロジェクトA", "タスクC"]）
}
