-- Direct Messaging Schema for NeuroChiro

-- 1. Conversations Table
CREATE TABLE IF NOT EXISTS public.conversations (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    participant_one_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    participant_two_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    last_message_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(participant_one_id, participant_two_id)
);

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

-- 2. Messages Table
CREATE TABLE IF NOT EXISTS public.messages (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    conversation_id uuid REFERENCES public.conversations(id) ON DELETE CASCADE NOT NULL,
    sender_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    body text NOT NULL,
    read_at timestamp with time zone,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies for Conversations
-- A user can see a conversation if they are participant_one or participant_two
CREATE POLICY "Users can view their own conversations" 
    ON public.conversations FOR SELECT 
    USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- A user can create a conversation if they are participant_one or participant_two
CREATE POLICY "Users can create conversations" 
    ON public.conversations FOR INSERT 
    WITH CHECK (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- A user can update their own conversations
CREATE POLICY "Users can update their own conversations" 
    ON public.conversations FOR UPDATE 
    USING (auth.uid() = participant_one_id OR auth.uid() = participant_two_id);

-- 4. RLS Policies for Messages
-- A user can view messages if they are the sender or recipient
CREATE POLICY "Users can view their own messages" 
    ON public.messages FOR SELECT 
    USING (auth.uid() = sender_id OR auth.uid() = recipient_id OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'));

-- A user can send a message
CREATE POLICY "Users can insert messages" 
    ON public.messages FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

-- A user can update a message to mark it as read (if they are the recipient)
CREATE POLICY "Users can update messages to mark as read" 
    ON public.messages FOR UPDATE 
    USING (auth.uid() = recipient_id);

-- 5. Trigger to update conversation's last_message_at
CREATE OR REPLACE FUNCTION public.update_conversation_timestamp()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update conversation timestamp
  UPDATE public.conversations
  SET last_message_at = NEW.created_at, updated_at = NOW()
  WHERE id = NEW.conversation_id;

  -- Insert notification for the recipient
  INSERT INTO public.notifications (user_id, title, body, type, link)
  SELECT 
    NEW.recipient_id,
    'New Message',
    'You received a new direct message.',
    'system',
    CASE 
      WHEN role = 'student' THEN '/student/messages?to=' || NEW.sender_id
      WHEN role = 'admin' THEN '/admin/inbox?to=' || NEW.sender_id
      ELSE '/doctor/messages?to=' || NEW.sender_id
    END
  FROM public.profiles
  WHERE id = NEW.recipient_id;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_message_inserted ON public.messages;
CREATE TRIGGER on_message_inserted
  AFTER INSERT ON public.messages
  FOR EACH ROW EXECUTE PROCEDURE public.update_conversation_timestamp();

-- 6. Enable Realtime for Messaging
-- Note: You may also need to enable Realtime for these tables in the Supabase Dashboard
ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
