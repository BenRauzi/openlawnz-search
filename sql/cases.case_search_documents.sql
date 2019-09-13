create materialized view cases.cases.case_search_documents
as 
	select 
		ca.id as case_id,
		ca.case_name,
		ca.case_date,
		cc.citation,
		setweight(to_tsvector('english',coalesce(ca.case_text,'')), 'C') ||
		setweight(to_tsvector('english',coalesce(ca.case_name,'')), 'A')  ||
		setweight(to_tsvector('english',coalesce(ca.case_footnotes,'')), 'D')  ||
		setweight(to_tsvector('english',coalesce(string_agg(l.title::text,' '),'')), 'A')  ||
		setweight(to_tsvector('english',coalesce(string_agg(l.year::text,' '),'')), 'C')  ||
		setweight(to_tsvector('english',coalesce(string_agg(l2ca."section"::text,' '),'')), 'B')  ||
		setweight(to_tsvector('english',coalesce(string_agg(co.court_name::text,' '),'')), 'B')  ||
		setweight(to_tsvector('english',coalesce(string_agg(co.acronym::text,' '),'')), 'B')
		as "document"
	from cases.cases.cases ca 
	left join cases.cases.legislation_to_cases l2ca
		on l2ca.case_id=ca.id
	left join cases.cases.legislation l
		on l.id=l2ca.legislation_id
	left join cases.cases.court_to_cases co2ca
		on co2ca.case_id=ca.id
	left join cases.cases.courts co
		on co.id=co2ca.id
	left join cases.cases.case_citations cc
		on cc.case_id=ca.id
	group by ca.id, cc.citation
	
create index idx_case_search_documents_document 
on cases.cases.case_search_documents
using gin ("document")