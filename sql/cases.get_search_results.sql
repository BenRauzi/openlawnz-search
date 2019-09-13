create or replace function cases.cases.get_search_results("search" varchar(160), "start" int, "end" int) 
returns table (
	case_id int,
	case_name varchar(1000),
	citation varchar(50),
	case_date date,
	rank real,
	total_matches bigint
) as $$
begin
	return query
	select 
		s.case_id,
		s.case_name,
		s.citation,
		s.case_date,
		ts_rank_cd('{0.5,0.7,0.9,1.0}',"document",query) as rank,
		count(*) over ()
	from cases.cases.case_search_documents s, plainto_tsquery('english',"search") query
	where query @@ "document" 
	order by rank desc
	offset start
	limit ("end"-start);
end; $$ language plpgsql;