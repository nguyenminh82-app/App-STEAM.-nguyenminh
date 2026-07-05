export type AgeGroup = "3-4 tuổi" | "4-5 tuổi" | "5-6 tuổi";
export type ModelType = "5E" | "EDP";

export interface ActivityPlan {
  id: string;
  name: string;
  topic: string;
  age: AgeGroup;
  model: ModelType;
  duration: string;
  content: string;
  fileName?: string;
  fileContent?: string;
  createdAt: string;
}

export interface GenerationRequest {
  topic: string;
  name: string;
  age: AgeGroup;
  model: ModelType;
  duration: string;
  request: string;
  currentPlanContent?: string;
  fileName?: string;
  fileContent?: string;
}
