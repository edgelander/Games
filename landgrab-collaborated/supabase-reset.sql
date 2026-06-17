-- LandGrab Collaborated — ONE-TIME board reset.
--
-- Run this ONCE in the Supabase SQL Editor when you want a clean slate
-- (e.g. clearing the Phase 4 test board + the duplicate accounts before the
-- Phase 5 username+PIN login goes live). It deletes ALL plots and players.
--
-- This is intentionally a SEPARATE file from supabase-setup.sql so that
-- re-running setup never wipes a live board.
--
-- (Uploaded images left in the 'plots' storage bucket are harmless orphans;
--  delete them from the dashboard Storage view if you want to reclaim space.)

truncate table public.plots;
delete from public.players;
