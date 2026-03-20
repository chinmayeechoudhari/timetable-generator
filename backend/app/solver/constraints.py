from ortools.sat.python import cp_model

def add_no_teacher_double_booking(model, assign, teachers, slots):
    """C1: teacher cannot be in two places at once"""
    for t in teachers:
        for slot in slots:
            overlapping = [
                v for (c, s, tt, sl, r), v in assign.items()
                if tt == t and sl == slot
            ]
            if overlapping:
                model.Add(sum(overlapping) <= 1)

def add_no_room_double_booking(model, assign, rooms, slots):
    """C2: room cannot have two classes at once"""
    for r in rooms:
        for slot in slots:
            overlapping = [
                v for (c, s, t, sl, rr), v in assign.items()
                if rr == r and sl == slot
            ]
            if overlapping:
                model.Add(sum(overlapping) <= 1)

def add_no_class_double_booking(model, assign, classes, slots):
    """C3: class cannot have two subjects at once"""
    for c in classes:
        for slot in slots:
            overlapping = [
                v for (cc, s, t, sl, r), v in assign.items()
                if cc == c and sl == slot
            ]
            if overlapping:
                model.Add(sum(overlapping) <= 1)

def add_periods_per_week(model, assign, subject_periods, subject_class_map):
    """C4: each subject must meet exactly periods_per_week times"""
    for s_id, needed in subject_periods.items():
        c_id = subject_class_map[s_id]
        valid = [
            v for (c, s, t, sl, r), v in assign.items()
            if c == c_id and s == s_id
        ]
        if valid:
            model.Add(sum(valid) == needed)

def add_teacher_subject_validity(model, assign, teacher_subjects):
    """C5: teacher can only teach their assigned subjects"""
    # Already enforced during variable creation — only valid
    # (teacher, subject) pairs get a BoolVar created.
    # This function is a placeholder for documentation.
    pass

def add_teacher_availability(model, assign, unavailable_pairs):
    """C6: teacher unavailable slots must not be assigned"""
    # unavailable_pairs = set of (teacher_id, slot_id) where is_available=False
    for (c, s, t, sl, r), var in assign.items():
        if (t, sl) in unavailable_pairs:
            model.Add(var == 0)

def add_lab_room_matching(model, assign, lab_subjects, lab_rooms):
    """C7: lab subjects must go to lab rooms only"""
    for (c, s, t, sl, r), var in assign.items():
        if s in lab_subjects and r not in lab_rooms:
            model.Add(var == 0)
        if s not in lab_subjects and r in lab_rooms:
            model.Add(var == 0)

# ✅ correct
def add_soft_max_periods_per_day(model, assign, teacher_max, slots_by_day):
    penalties = []
    for t_id, max_p in teacher_max.items():
        for day, day_slots in slots_by_day.items():
            day_assigns = [v for (c,s,tt,sl,r),v in assign.items() if tt==t_id and sl in day_slots]
            if len(day_assigns) > max_p:
                overflow = model.NewIntVar(0, len(day_assigns), f'overflow_t{t_id}_d{day}')
                model.Add(overflow >= sum(day_assigns) - max_p)
                penalties.append(overflow)
    return penalties
