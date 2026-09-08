import { supabase } from "../config/supabase.js";
import { AppError } from "../utils/errors.js";

const ensure = () => { if (!supabase) throw new AppError("Supabase no esta configurado", 503, "DATABASE_UNAVAILABLE"); };

export const createSession = async (payload) => {
  ensure();
  const { data, error } = await supabase.from("monitoring_sessions").insert(payload).select().single();
  if (error) throw new AppError(error.message, 400, "DATABASE_ERROR");
  return data;
};

export const saveAssessment = async (payload) => {
  ensure();
  const { data, error } = await supabase.from("environmental_assessments").insert(payload).select().single();
  if (error) throw new AppError(error.message, 400, "DATABASE_ERROR");
  return data;
};

export const listParcelAlerts = async (parcelId) => {
  ensure();
  const [forest, fire, assessments] = await Promise.all([
    supabase.from("deforestation_alerts").select("*").eq("parcel_id", parcelId).order("detected_at", { ascending: false }),
    supabase.from("fire_alerts").select("*").eq("parcel_id", parcelId).order("detected_at", { ascending: false }),
    supabase.from("environmental_assessments").select("*").eq("parcel_id", parcelId).order("created_at", { ascending: false })
  ]);
  const failure = [forest, fire, assessments].find((result) => result.error);
  if (failure) throw new AppError(failure.error.message, 502, "DATABASE_ERROR");
  return { deforestationAlerts: forest.data, fireAlerts: fire.data, assessments: assessments.data };
};
