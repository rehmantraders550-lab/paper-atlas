export interface Material {
  id: string;
  name: string;
  material_family: string;
  common_uses: string[];
  surface_or_feel: string;
  manufacturing_origin: string | null;
  image_url?: string;
}
