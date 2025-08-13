export type ItemType = "Project" | "Idea" | "Task" | "Link" | "Note";
export type Status = "inbox" | "active" | "done";

export interface Project {
  id: string;
  name: string;
  color?: string;
  description?: string | null;
  createdAt: string;
}

export interface Item {
  id: string;
  type: ItemType;
  projectId?: string | null;
  parentId?: string | null;
  title: string;
  body?: string;
  tags: string[];
  links?: { url: string; kind: "youtube" | "web" | "file"; title?: string }[];
  status: Status;
  priority?: number;
  energy?: "low" | "med" | "high";
  timeEstimateMin?: number;
  remindAt?: string | null;
  source: "voice" | "text" | "paste";
  createdAt: string;
  updatedAt: string;
}

export interface YouTubeVideo {
  id: string;
  title: string;
  channelTitle: string;
  thumbnail: string;
  publishedAt: string;
  viewCount?: number;
}