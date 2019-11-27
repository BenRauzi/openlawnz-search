CREATE OR REPLACE FUNCTION "search".create_document_vectors() RETURNS TRIGGER AS $$
BEGIN
	NEW.full_text_search_document = 
		setweight(to_tsvector('english',coalesce(NEW."document"->>'case_text','')), 'B') ||
		setweight(to_tsvector('english',coalesce(NEW."document"->>'case_name','')), 'A');
	NEW.case_name_search_document =
		to_tsvector('english',coalesce(NEW."document"->>'case_name',''));
	
	WITH unique_legislation_titles AS (
		SELECT l->>'title' AS title 
		FROM (
			SELECT JSONB_ARRAY_ELEMENTS(NEW."document"->'legislation') AS l
			WHERE NEW."document"->'legislation' != 'null'
		) AS a
		GROUP BY title
	)
	INSERT INTO "search".legislation_documents
	SELECT ULT.title, to_tsvector('english',coalesce(ULT.title,''))
	FROM unique_legislation_titles ULT
	WHERE NOT EXISTS (
		SELECT 1 
		FROM "search".legislation_documents LDO
		WHERE LDO.title=ULT.title
	);

	WITH unique_legislation_section AS (
		SELECT l->>'title' AS title, l->>'section' AS "section" 
		FROM (
			SELECT JSONB_ARRAY_ELEMENTS(NEW."document"->'legislation') AS l
			WHERE NEW."document"->'legislation' != 'null'
		) AS a
		GROUP BY title,"section"
	)
	INSERT INTO "search".legislation_act_section_documents
	SELECT ULT.title, ULT."section"
	FROM unique_legislation_section ULT
	WHERE NOT EXISTS (
		SELECT 1 
		FROM "search".legislation_act_section_documents LDO
		WHERE LDO.title=ULT.title AND LDO."section"=ULT."section"
	);


	RETURN NEW;
END $$ LANGUAGE plpgsql