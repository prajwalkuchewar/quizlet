import axios from "axios";
import config from "../config/config";
import {
  LlmStatus,
  Material,
  MaterialSearchResult,
} from "../models/Study";

export const listMaterials = async () => {
  const { data } = await axios.get<Material[]>(config.materialsUrl);
  return data;
};

export const addTextMaterial = async (title: string, content: string) => {
  const { data } = await axios.post<Material>(`${config.materialsUrl}/text`, {
    title,
    content,
  });
  return data;
};

export const uploadMaterial = async (file: File, title?: string) => {
  const form = new FormData();
  form.append("file", file);
  if (title) form.append("title", title);
  const { data } = await axios.post<Material>(
    `${config.materialsUrl}/upload`,
    form,
  );
  return data;
};

export const deleteMaterial = async (id: number) => {
  await axios.delete(`${config.materialsUrl}/${id}`);
};

export const searchMaterials = async (
  query: string,
  materialIds: number[] = [],
  limit = 5,
) => {
  const { data } = await axios.post<MaterialSearchResult[]>(
    `${config.materialsUrl}/search`,
    { query, materialIds, limit },
  );
  return data;
};

export const getLlmStatus = async () => {
  const { data } = await axios.get<LlmStatus>(`${config.llmUrl}/status`);
  return data;
};
