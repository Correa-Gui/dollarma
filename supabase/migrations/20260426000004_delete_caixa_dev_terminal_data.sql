DO $$
DECLARE
  v_terminal_id UUID := '3b243d42-9466-40c9-8d18-0e5c46f7fd0b';
BEGIN
  DELETE FROM public.audit_logs
  WHERE entity_name = 'CAIXA DEV'
     OR (entity_type IN ('pdv_terminal', 'terminal') AND entity_id = v_terminal_id::text)
     OR (entity_type IN ('cash_register_session', 'cash_session') AND entity_id IN (
          SELECT id::text
          FROM public.cash_register_sessions
          WHERE terminal_id = v_terminal_id
        ))
     OR (entity_type IN ('sale', 'sales') AND entity_id IN (
          SELECT id::text
          FROM public.sales
          WHERE terminal_id = v_terminal_id
             OR session_id IN (
                  SELECT id
                  FROM public.cash_register_sessions
                  WHERE terminal_id = v_terminal_id
                )
        ))
     OR (entity_type IN ('sale_item', 'sale_items') AND entity_id IN (
          SELECT si.id::text
          FROM public.sale_items si
          INNER JOIN public.sales s ON s.id = si.sale_id
          WHERE s.terminal_id = v_terminal_id
             OR s.session_id IN (
                  SELECT id
                  FROM public.cash_register_sessions
                  WHERE terminal_id = v_terminal_id
                )
        ))
     OR (entity_type IN ('cash_register_movement', 'cash_movement') AND entity_id IN (
          SELECT id::text
          FROM public.cash_register_movements
          WHERE session_id IN (
                  SELECT id
                  FROM public.cash_register_sessions
                  WHERE terminal_id = v_terminal_id
                )
             OR sale_id IN (
                  SELECT id
                  FROM public.sales
                  WHERE terminal_id = v_terminal_id
                     OR session_id IN (
                          SELECT id
                          FROM public.cash_register_sessions
                          WHERE terminal_id = v_terminal_id
                        )
                )
        ));

  DELETE FROM public.cash_register_movements
  WHERE session_id IN (
          SELECT id
          FROM public.cash_register_sessions
          WHERE terminal_id = v_terminal_id
        )
     OR sale_id IN (
          SELECT id
          FROM public.sales
          WHERE terminal_id = v_terminal_id
             OR session_id IN (
                  SELECT id
                  FROM public.cash_register_sessions
                  WHERE terminal_id = v_terminal_id
                )
        );

  DELETE FROM public.sale_items
  WHERE sale_id IN (
    SELECT id
    FROM public.sales
    WHERE terminal_id = v_terminal_id
       OR session_id IN (
            SELECT id
            FROM public.cash_register_sessions
            WHERE terminal_id = v_terminal_id
          )
  );

  DELETE FROM public.sales
  WHERE terminal_id = v_terminal_id
     OR session_id IN (
          SELECT id
          FROM public.cash_register_sessions
          WHERE terminal_id = v_terminal_id
        );

  DELETE FROM public.cash_register_sessions
  WHERE terminal_id = v_terminal_id;

  DELETE FROM public.pdv_terminals
  WHERE id = v_terminal_id
    AND name = 'CAIXA DEV';
END $$;
