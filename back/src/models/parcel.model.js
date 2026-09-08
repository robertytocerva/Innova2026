import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/errors.js";
import { polygonToWkt } from "../utils/geo.js";

const ensure = () => { if (!supabase) throw new AppError("Supabase no esta configurado", 503, "DATABASE_UNAVAILABLE"); };

export const listParcels = async ({ limit = 20, offset = 0, status = "active" }) => {
  ensure();
  const { data, error, count } = await supabase.from("parcels").select("*", { count: "exact" }).eq("status", status).range(offset, offset + limit - 1).order("created_at", { ascending: false });
  if (error) throw new AppError(error.message, 502, "DATABASE_ERROR");
  return { data, count };
};

export const findParcel = async (id) => {
  ensure();
  const { data, error } = await supabase.from("parcels").select("*").eq("id", id).maybeSingle();
  if (error) throw new AppError(error.message, 502, "DATABASE_ERROR");
  return data;
};

export const createParcel = async ({ name, cropType, municipality, state, geometry, metadata = {} }) => {
  ensure();
  const { data, error } = await supabase.from("parcels").insert({ name, crop_type: cropType, municipality, state, geometry: polygonToWkt(geometry), metadata }).select().single();
  if (error) throw new AppError(error.message, 400, "DATABASE_ERROR");
  return data;
};

export const archiveParcel = async (id) => {
  ensure();
  const { data, error } = await supabase.from("parcels").update({ status: "archived" }).eq("id", id).select().single();
  if (error) throw new AppError(error.message, 400, "DATABASE_ERROR");
  return data;
};
