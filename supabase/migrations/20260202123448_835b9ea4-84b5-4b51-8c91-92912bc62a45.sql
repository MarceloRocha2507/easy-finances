-- Create category_rules table
CREATE TABLE public.category_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  category_id uuid NOT NULL REFERENCES public.categories(id) ON DELETE CASCADE,
  keywords text[] NOT NULL DEFAULT '{}',
  case_insensitive boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT true,
  priority integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_category_rules_user_id ON public.category_rules(user_id);
CREATE INDEX idx_category_rules_category_id ON public.category_rules(category_id);

-- Enable RLS
ALTER TABLE public.category_rules ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own rules"
ON public.category_rules
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own rules"
ON public.category_rules
FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own rules"
ON public.category_rules
FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own rules"
ON public.category_rules
FOR DELETE
USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE TRIGGER update_category_rules_updated_at
BEFORE UPDATE ON public.category_rules
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();