-- FigBud Supabase Schema
-- Run this in your Supabase SQL editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (extends Supabase auth.users)
CREATE TABLE IF NOT EXISTS public.figbud_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  display_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Component templates table
CREATE TABLE IF NOT EXISTS public.component_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.figbud_users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  component_type TEXT NOT NULL,
  properties JSONB NOT NULL,
  is_public BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Usage history table
CREATE TABLE IF NOT EXISTS public.usage_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.figbud_users(id) ON DELETE CASCADE,
  action_type TEXT NOT NULL, -- 'component_created', 'chat_query', 'sandbox_created'
  component_type TEXT,
  chat_prompt TEXT,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Chat conversations table
CREATE TABLE IF NOT EXISTS public.chat_conversations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES public.figbud_users(id) ON DELETE CASCADE,
  widget_session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Chat messages table
CREATE TABLE IF NOT EXISTS public.chat_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id UUID REFERENCES public.chat_conversations(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Indexes for performance
CREATE INDEX idx_component_templates_user_id ON public.component_templates(user_id);
CREATE INDEX idx_usage_history_user_id ON public.usage_history(user_id);
CREATE INDEX idx_chat_conversations_user_id ON public.chat_conversations(user_id);
CREATE INDEX idx_chat_messages_conversation_id ON public.chat_messages(conversation_id);

-- Row Level Security (RLS) policies
ALTER TABLE public.figbud_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.component_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.chat_messages ENABLE ROW LEVEL SECURITY;

-- Policies for figbud_users
CREATE POLICY "Users can view own profile" ON public.figbud_users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.figbud_users
  FOR UPDATE USING (auth.uid() = id);

-- Policies for component_templates
CREATE POLICY "Users can view own templates" ON public.component_templates
  FOR SELECT USING (auth.uid() = user_id OR is_public = true);

CREATE POLICY "Users can create own templates" ON public.component_templates
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own templates" ON public.component_templates
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own templates" ON public.component_templates
  FOR DELETE USING (auth.uid() = user_id);

-- Policies for usage_history
CREATE POLICY "Users can view own usage" ON public.usage_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own usage" ON public.usage_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for chat_conversations
CREATE POLICY "Users can view own conversations" ON public.chat_conversations
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own conversations" ON public.chat_conversations
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Policies for chat_messages
CREATE POLICY "Users can view messages in own conversations" ON public.chat_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create messages in own conversations" ON public.chat_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.chat_conversations
      WHERE chat_conversations.id = chat_messages.conversation_id
      AND chat_conversations.user_id = auth.uid()
    )
  );

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_figbud_users_updated_at BEFORE UPDATE ON public.figbud_users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_component_templates_updated_at BEFORE UPDATE ON public.component_templates
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();