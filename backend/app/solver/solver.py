from ortools.sat.python import cp_model
from sqlalchemy.orm import Session
from app.solver.data_loader import load_solver_data
from app.solver.constraints import (
    add_no_teacher_double_booking,
    add_no_room_double_booking,
    add_no_class_double_booking,
    add_periods_per_week,
    add_teacher_availability,
    add_lab_room_matching,
    add_soft_max_periods_per_day,
    add_soft_no_consecutive_periods,
    add_soft_even_distribution,
)
from app.solver.solution_parser import parse_and_save_solution, solution_to_dict

def build_and_solve(db: Session) -> dict:
    data = load_solver_data(db)
    model = cp_model.CpModel()

    # --- Build decision variables ---
    assign = {}
    for s_id, c_id in data['subject_map'].items():
        for t_id in data['teacher_ids']:
            # Only create variable if teacher can teach this subject
            if s_id not in data['teacher_subjects'].get(t_id, []):
                continue
            for sl_id in data['slot_ids']:
                for r_id in data['room_ids']:
                    assign[(c_id, s_id, t_id, sl_id, r_id)] = model.NewBoolVar(
                        f'a_c{c_id}_s{s_id}_t{t_id}_sl{sl_id}_r{r_id}'
                    )

    # --- Hard constraints ---
    add_no_teacher_double_booking(model, assign,
        data['teacher_ids'], data['slot_ids'])
    add_no_room_double_booking(model, assign,
        data['room_ids'], data['slot_ids'])
    add_no_class_double_booking(model, assign,
        data['class_ids'], data['slot_ids'])
    add_periods_per_week(model, assign,
        data['subject_periods'], data['subject_map'])
    add_teacher_availability(model, assign,
        data['unavailable_pairs'])
    add_lab_room_matching(model, assign,
        data['lab_subjects'], data['lab_rooms'])

   
   # --- Soft constraints (penalties) ---
    penalties = []

    penalties += add_soft_max_periods_per_day(
        model, assign,
        data['teacher_max_periods'],
        data['slots_by_day']
    )
    penalties += add_soft_no_consecutive_periods(
        model, assign,
        data['teacher_ids'],
        data['slots_by_day']
    )
    penalties += add_soft_even_distribution(
        model, assign,
        data['subject_periods'],
        data['subject_map'],
        data['slots_by_day']
    )

    if penalties:
        model.Minimize(sum(penalties))

    # --- Solve ---
    solver = cp_model.CpSolver()
    solver.parameters.max_time_in_seconds = 60.0
    status = solver.Solve(model)

    if status in (cp_model.OPTIMAL, cp_model.FEASIBLE):
        result = parse_and_save_solution(solver, assign, db)
        result['timetable'] = solution_to_dict(solver, assign)
        return result
    else:
        return {'status': 'no_solution',
                'reason': 'Constraints may be too tight. Check data.'}
