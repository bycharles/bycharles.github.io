alter table public.cards add column if not exists reference_paper text not null default '';
alter table public.cards add column if not exists method_source text not null default '';
alter table public.cards add column if not exists updated_at timestamptz not null default now();
alter table public.cards add column if not exists updated_by uuid references auth.users(id) on delete set null;
alter table public.cards add column if not exists deleted_at timestamptz;
alter table public.cards add column if not exists deleted_by uuid references auth.users(id) on delete set null;

update public.cards set reference_paper=case id
 when 'controlled-experiment' then 'Borgo, R. et al. (2018). An Empirical Study on Using Visual Embellishments in Visualization. IEEE TVCG, 24(1), 1356-1366. https://doi.org/10.1109/TVCG.2017.274419'
 when 'ab-test' then 'Kohavi, R. et al. (2009). Controlled Experiments on the Web: Survey and Practical Guide. Data Mining and Knowledge Discovery, 18, 140-181. https://doi.org/10.1007/s10618-008-0114-1'
 when 'eye-tracking' then 'Duchowski, A. T. (2002). A Breadth-First Survey of Eye-Tracking Applications. Behavior Research Methods, Instruments, & Computers, 34, 455-470. https://doi.org/10.3758/BF03195475'
 when 'survey' then 'Artino, A. R. et al. (2014). Developing Questionnaires for Educational Research: AMEE Guide No. 87. Medical Teacher, 36(6), 463-474. https://doi.org/10.3109/0142159X.2014.889814'
 when 'log-analysis' then 'Hilbert, D. M., & Redmiles, D. F. (2000). Extracting Usability Information from User Interface Events. ACM TOCHI, 7(4), 384-421. https://doi.org/10.1145/355324.355325'
 when 'interview' then 'Kallio, H. et al. (2016). Systematic Methodological Review: Developing a Framework for a Qualitative Semi-Structured Interview Guide. Journal of Advanced Nursing, 72(12), 2954-2965. https://doi.org/10.1111/jan.13031'
 when 'think-aloud' then 'Charters, E. (2003). The Use of Think-Aloud Methods in Qualitative Research. Brock Education Journal, 12(2). https://doi.org/10.26522/brocked.v12i2.38'
 when 'contextual-inquiry' then 'Raven, M. E., & Flanders, A. (1996). Using Contextual Inquiry to Learn About Your Audiences. SIGDOC 1996, 1-13. https://doi.org/10.1145/227614.227615'
 when 'heuristic-review' then 'Nielsen, J., & Molich, R. (1990). Heuristic Evaluation of User Interfaces. CHI 1990, 249-256. https://doi.org/10.1145/97243.97281'
 when 'usability-test' then 'Lewis, J. R. (2014). Usability: Lessons Learned and Yet to Be Learned. International Journal of Human-Computer Interaction, 30(9), 663-684. https://doi.org/10.1080/10447318.2014.930311'
 when 'field-study' then 'Rogers, Y., & Marshall, P. (2017). Research in the Wild. Synthesis Lectures on Human-Centered Informatics. https://doi.org/10.2200/S00764ED1V01Y201703HCI037'
 when 'diary-study' then 'Bolger, N., Davis, A., & Rafaeli, E. (2003). Diary Methods: Capturing Life as It Is Lived. Annual Review of Psychology, 54, 579-616. https://doi.org/10.1146/annurev.psych.54.101601.145030'
 when 'mixed-sequential' then 'Ivankova, N. V., Creswell, J. W., & Stick, S. L. (2006). Using Mixed-Methods Sequential Explanatory Design. Field Methods, 18(1), 3-20. https://doi.org/10.1177/1525822X05282260'
 else reference_paper end,
 method_source=case id
 when 'controlled-experiment' then 'Lazar, J., Feng, J. H., & Hochheiser, H. (2017). Research Methods in Human-Computer Interaction (2nd ed.). Morgan Kaufmann. https://www.sciencedirect.com/book/9780128053904/research-methods-in-human-computer-interaction'
 when 'ab-test' then 'Kohavi, R., Tang, D., & Xu, Y. (2020). Trustworthy Online Controlled Experiments. Cambridge University Press. https://doi.org/10.1017/9781108653985'
 when 'eye-tracking' then 'Duchowski, A. T. (2017). Eye Tracking Methodology: Theory and Practice (3rd ed.). Springer. https://doi.org/10.1007/978-3-319-57883-5'
 when 'survey' then 'AAPOR. Best Practices for Survey Research. https://aapor.org/standards-and-ethics/best-practices/'
 when 'log-analysis' then 'Lazar, J., Feng, J. H., & Hochheiser, H. (2017). Research Methods in Human-Computer Interaction (2nd ed.), Chapter on automated usability data. https://www.sciencedirect.com/book/9780128053904/research-methods-in-human-computer-interaction'
 when 'interview' then 'Brinkmann, S., & Kvale, S. (2015). InterViews: Learning the Craft of Qualitative Research Interviewing (3rd ed.). SAGE. https://us.sagepub.com/en-us/nam/interviews/book239402'
 when 'think-aloud' then 'van Someren, M. W., Barnard, Y. F., & Sandberg, J. A. C. (1994). The Think Aloud Method. Academic Press. https://www.researchgate.net/publication/215439100_The_Think_Aloud_Method_A_Practical_Guide_to_Modelling_CognitiveProcesses'
 when 'contextual-inquiry' then 'Beyer, H., & Holtzblatt, K. (1998). Contextual Design: Defining Customer-Centered Systems. Morgan Kaufmann. https://www.sciencedirect.com/book/9781558604117/contextual-design'
 when 'heuristic-review' then 'Nielsen Norman Group. 10 Usability Heuristics for User Interface Design. https://www.nngroup.com/articles/ten-usability-heuristics/'
 when 'usability-test' then 'ISO 9241-11:2018. Ergonomics of Human-System Interaction - Usability: Definitions and Concepts. https://www.iso.org/standard/63500.html'
 when 'field-study' then 'Rogers, Y., Sharp, H., & Preece, J. (2023). Interaction Design (6th ed.), in-the-wild studies. Wiley. https://www.wiley.com/en-us/Interaction+Design%3A+Beyond+Human+Computer+Interaction%2C+6th+Edition-p-9781119901099'
 when 'diary-study' then 'Alaszewski, A. (2006). Using Diaries for Social Research. SAGE. https://doi.org/10.4135/9780857020215'
 when 'mixed-sequential' then 'Creswell, J. W., & Plano Clark, V. L. (2018). Designing and Conducting Mixed Methods Research (3rd ed.). SAGE. https://us.sagepub.com/en-us/nam/designing-and-conducting-mixed-methods-research/book241842'
 else method_source end;

alter table public.cards add constraint cards_reference_required check (length(trim(reference_paper)) > 0) not valid;
alter table public.cards add constraint cards_source_required check (length(trim(method_source)) > 0) not valid;
alter table public.cards validate constraint cards_reference_required;
alter table public.cards validate constraint cards_source_required;

create table if not exists public.favorites (
 user_id uuid not null references auth.users(id) on delete cascade,
 card_id text not null references public.cards(id) on delete cascade,
 created_at timestamptz not null default now(), primary key(user_id,card_id));
create table if not exists public.card_versions (
 id bigint generated always as identity primary key, card_id text not null,
 snapshot jsonb not null, action text not null,
 changed_by uuid references auth.users(id) on delete set null,
 changed_by_email text not null, changed_at timestamptz not null default now());
create index if not exists card_versions_card_id_idx on public.card_versions(card_id,changed_at desc);
alter table public.favorites enable row level security;
alter table public.card_versions enable row level security;

do $$ declare p record; begin for p in select tablename,policyname from pg_policies where schemaname='public' and tablename in ('cards','favorites','card_versions') loop execute format('drop policy if exists %I on public.%I',p.policyname,p.tablename); end loop; end $$;
create policy "Public reads active cards" on public.cards for select using (deleted_at is null or lower(coalesce(auth.jwt()->>'email',''))='cgao@stu.ecnu.edu.cn');
create policy "Admin inserts cards" on public.cards for insert to authenticated with check (lower(auth.jwt()->>'email')='cgao@stu.ecnu.edu.cn');
create policy "Admin updates cards" on public.cards for update to authenticated using (lower(auth.jwt()->>'email')='cgao@stu.ecnu.edu.cn') with check (lower(auth.jwt()->>'email')='cgao@stu.ecnu.edu.cn');
create policy "Users read own favorites" on public.favorites for select to authenticated using (auth.uid()=user_id);
create policy "Users add own favorites" on public.favorites for insert to authenticated with check (auth.uid()=user_id);
create policy "Users delete own favorites" on public.favorites for delete to authenticated using (auth.uid()=user_id);
create policy "Admin reads history" on public.card_versions for select to authenticated using (lower(auth.jwt()->>'email')='cgao@stu.ecnu.edu.cn');
create policy "Admin writes history" on public.card_versions for insert to authenticated with check (lower(auth.jwt()->>'email')='cgao@stu.ecnu.edu.cn');
grant select on public.cards to anon,authenticated;
grant insert,update on public.cards to authenticated;
grant select,insert,delete on public.favorites to authenticated;
grant select,insert on public.card_versions to authenticated;
grant usage,select on sequence public.card_versions_id_seq to authenticated;
