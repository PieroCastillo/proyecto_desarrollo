import type { ObjectId } from "mongodb";

export type LoginBody = {
  username: string;
  password: string;
};

export type RegisterBody = {
  username: string;
  password: string;
  role?: string;
};

export type User = {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  role: string;
};

export type CreateClientBody = {
  name: string;
  phone: string;
  address: string;
};

export type Client = {
  _id?: ObjectId;
  name: string;
  phone: string;
  address: string;
};

export type CreateConsultantBody = {
  name: string;
  dni: string;
  phone: string;
  zone: string;
};

export type UpdateConsultantBody = Partial<CreateConsultantBody>;

export type Consultant = {
  _id?: ObjectId;
  name: string;
  dni: string;
  phone: string;
  zone: string;
  deletedAt: Date | null;
};

export type CreateProductBody = {
  name: string;
  category: string;
  price: number;
  stock: number;
};

export type PatchStockBody = {
  delta: number;
};

export type Product = {
  _id?: ObjectId;
  name: string;
  category: string;
  price: number;
  stock: number;
};

export type Training = {
  _id?: ObjectId;
  title: string;
  description: string;
  videoUrl: string;
  instructor: string;
  category: string;
  points: number;
  createdAt: Date;
};

export type TrainingParticipation = {
  _id?: ObjectId;
  trainingId: ObjectId;
  consultantId: ObjectId;
  completedAt: Date;
};