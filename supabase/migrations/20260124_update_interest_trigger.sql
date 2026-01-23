-- Update on_interest_created function to handle investor interests
CREATE OR REPLACE FUNCTION public.on_interest_created()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_founder_id uuid;
  v_startup_name text;
  v_user_name text;
  v_user_role text;
BEGIN
  -- Get startup founder and name
  SELECT founder_id, name INTO v_founder_id, v_startup_name
  FROM startups WHERE id = NEW.startup_id;
  
  -- Get user name and role
  SELECT full_name, role INTO v_user_name, v_user_role
  FROM profiles WHERE id = NEW.user_id;
  
  -- Create notification based on interest type
  IF NEW.interest_type = 'investor' THEN
    PERFORM create_notification(
      v_founder_id,
      'Investor Interest',
      v_user_name || ' (Investor) has shown interest in ' || v_startup_name,
      'investor_interest',
      NEW.startup_id
    );
  ELSE
    -- Default talent interest notification
    PERFORM create_notification(
      v_founder_id,
      'New Interest!',
      v_user_name || ' is interested in ' || v_startup_name,
      'interest',
      NEW.startup_id
    );
  END IF;
  
  RETURN NEW;
END;
$$;
