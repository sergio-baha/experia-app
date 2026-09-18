import React from 'react'
import {
  useStore, INITIAL_INSTITUTIONS, AREAS,
  createAccount, deleteAccount, changeAccountArea, changeAccountInstitution, resetStudentProgress, setAccountActive,
  assignInstructorInstitution, removeInstructorInstitution, assignRouteToInstitution,
  bulkCreateAccounts, setUserCourseAccess, setUserCourseAccessBulk, isBaseCourse,
  setAccountUiVariant
} from '../store/store.jsx'
import {
  useMobile, LogoImg, CheckIc, XIc, PlusIc, TrashIc, EditIc, UploadIc, Btn, Modal, ChecklistDropdown
} from '../components/ui.jsx'
import {
  PageHead, StatsRow, SearchInput, SegmentedTabs, Pill, UserAvatar,
  usePaged, Pagination, RowMenu, Collapsible, EmptyState, inputStyle
} from '../components/adminUI.jsx'
import { supabase } from '../lib/supabaseClient.js'

// =============================================
// BULK UPLOAD MODAL
// =============================================
const BulkUploadModal = ({ open, onClose }) => {
  const accounts = useStore(s => s.accounts);
  const [step, setStep] = React.useState(1);
  const [rows, setRows] = React.useState([]);
  const [importCount, setImportCount] = React.useState(0);
  const [dragOver, setDragOver] = React.useState(false);
  const fileRef = React.useRef();
  const isMobile = useMobile();

  const nrm = (str) => str.toString().toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim();

  const processFile = (file) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const XLSX = await import('xlsx');
        const wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const jsonRows = XLSX.utils.sheet_to_json(ws, { defval: '' });
        if (!jsonRows.length) { alert('El archivo está vacío.'); return; }

        const parsed = jsonRows.map(row => {
          const n = {};
          Object.keys(row).forEach(k => { n[nrm(k)] = row[k]; });
          return {
            nombre: (n['nombre'] || n['name'] || '').toString().trim(),
            email: (n['email'] || n['correo'] || '').toString().trim().toLowerCase(),
            contrasena: (n['contrasena'] || n['password'] || n['pass'] || n['clave'] || '').toString().trim(),
            rol: (n['rol'] || n['role'] || 'student').toString().trim().toLowerCase(),
            area: (n['area'] || n['area de formacion'] || '').toString().trim().toLowerCase(),
            institucion: (n['institucion'] || n['colegio'] || n['institucion educativa'] || '').toString().trim(),
          };
        }).filter(r => r.nombre || r.email);

        const seenEmails = new Set(accounts.map(a => a.email));
        const processed = parsed.map((row, i) => {
          const roleNorm = row.rol === 'estudiante' ? 'student' : row.rol;
          const role = ['student', 'instructor'].includes(roleNorm) ? roleNorm : 'student';
          const areaMatch = AREAS.find(a => a.id === row.area || nrm(a.name) === nrm(row.area));
          const area = areaMatch?.id || null;
          const errors = [];
          if (!row.nombre) errors.push('Nombre requerido');
          if (!row.email || !row.email.includes('@')) errors.push('Email inválido');
          else if (seenEmails.has(row.email)) errors.push('Email ya existe');
          if (!row.contrasena || row.contrasena.length < 4) errors.push('Contraseña mínimo 4 caracteres');
          if (role === 'student' && !area) errors.push('Área inválida');
          if (!errors.some(er => er.includes('Email')) && row.email) seenEmails.add(row.email);
          return { ...row, _i: i + 1, _errors: errors, _valid: errors.length === 0, _role: role, _area: area };
        });
        setRows(processed);
        setStep(2);
      } catch (err) { alert('Error al leer el archivo. Verifica que sea Excel o CSV válido.'); }
    };
    reader.readAsArrayBuffer(file);
  };

  const downloadTemplate = async () => {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.aoa_to_sheet([
      ['Nombre', 'Email', 'Contraseña', 'Rol', 'Área', 'Institución'],
      ['María García', 'maria@colegio.com', 'pass1234', 'student', 'lectura', 'IED San Francisco'],
      ['Carlos Ruiz', 'carlos@colegio.com', 'pass1234', 'student', 'matematicas', 'Liceo Los Andes'],
      ['Ana López', 'ana@colegio.com', 'pass1234', 'instructor', '', 'IED San Francisco'],
    ]);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Usuarios');
    XLSX.writeFile(wb, 'plantilla_usuarios_experia.xlsx');
  };

  const handleImport = () => {
    const valid = rows.filter(r => r._valid);
    bulkCreateAccounts(valid.map(r => ({ name: r.nombre, email: r.email, pass: r.contrasena, role: r._role, area: r._area, institution: r.institucion })));
    setImportCount(valid.length);
    setStep(3);
  };

  const handleClose = () => {
    setStep(1); setRows([]); setImportCount(0); setDragOver(false);
    if (fileRef.current) fileRef.current.value = '';
    onClose();
  };

  const validRows = rows.filter(r => r._valid);
  const invalidRows = rows.filter(r => !r._valid);

  return (
    <Modal open={open} onClose={handleClose} title="Carga Masiva de Usuarios" width={700}>
      {/* Steps indicator */}
      <div style={{ display:'flex', alignItems:'center', marginBottom:28 }}>
        {['Subir archivo','Revisar datos','Completado'].map((label, i) => (
          <React.Fragment key={i}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{ width:30, height:30, borderRadius:'50%', display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800, background: step >= i+1 ? 'var(--gradient)' : 'var(--bg-alt)',
                color: step >= i+1 ? '#fff' : 'var(--muted)' }}>{i+1}</div>
              <span style={{ fontSize:10, fontWeight:600, color: step >= i+1 ? 'var(--orange)' : 'var(--subtle)', whiteSpace:'nowrap' }}>{label}</span>
            </div>
            {i < 2 && <div style={{ flex:1, height:2, background: step > i+1 ? 'var(--orange)' : 'var(--border)', margin:'0 6px 18px' }} />}
          </React.Fragment>
        ))}
      </div>

      {/* Step 1: Upload */}
      {step === 1 && (
        <div>
          <div style={{ padding:'16px 20px', borderRadius:12, background:'var(--bg)', border:'1px solid var(--border)', marginBottom:16 }}>
            <p style={{ fontSize:13, fontWeight:700, color:'var(--dark)', marginBottom:8 }}>Columnas requeridas en el archivo:</p>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:8 }}>
              {['Nombre','Email','Contraseña','Rol','Área','Institución'].map(col => (
                <span key={col} style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:6,
                  background:'var(--white)', border:'1px solid var(--border)', color:'var(--purple-deep)' }}>{col}</span>
              ))}
            </div>
            <p style={{ fontSize:12, color:'var(--subtle)', lineHeight:1.5 }}>
              <strong>Rol:</strong> student · instructor &nbsp;|&nbsp; <strong>Área:</strong> lectura · ciudadanas · ingles · matematicas · ciencias
            </p>
          </div>
          <button onClick={downloadTemplate}
            style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:10,
              border:'1.5px solid var(--border)', background:'var(--white)', color:'var(--text-sec)',
              fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer', marginBottom:20, transition:'all .2s' }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--orange)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}>
            📥 Descargar plantilla Excel
          </button>
          <label style={{ display:'block', cursor:'pointer' }}>
            <div style={{ padding:'36px 24px', borderRadius:14, textAlign:'center', transition:'all .2s', cursor:'pointer',
              border: `2px dashed ${dragOver ? 'var(--orange)' : 'var(--border)'}`,
              background: dragOver ? 'var(--orange-bg)' : 'var(--bg)' }}
              onDragOver={e => { e.preventDefault(); setDragOver(true); }}
              onDragLeave={() => setDragOver(false)}
              onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if(f) processFile(f); }}>
              <div style={{ fontSize:40, marginBottom:12 }}>📂</div>
              <p style={{ fontSize:14, fontWeight:700, color:'var(--dark)', marginBottom:4 }}>
                Arrastra tu archivo aquí o haz clic para seleccionar
              </p>
              <p style={{ fontSize:12, color:'var(--muted)' }}>Soporta .xlsx, .xls y .csv</p>
            </div>
            <input ref={fileRef} type="file" accept=".xlsx,.xls,.csv"
              onChange={e => { const f = e.target.files[0]; if(f) processFile(f); }}
              style={{ display:'none' }} />
          </label>
        </div>
      )}

      {/* Step 2: Preview */}
      {step === 2 && (
        <div>
          <div style={{ display:'flex', gap:10, marginBottom:16 }}>
            <div style={{ flex:1, padding:'12px 16px', borderRadius:10, background:'#CCFBF1', border:'1px solid #5EEAD4' }}>
              <div style={{ fontSize:22, fontWeight:800, color:'var(--success)' }}>{validRows.length}</div>
              <div style={{ fontSize:12, color:'var(--success)', fontWeight:600 }}>Válidos — se crearán</div>
            </div>
            <div style={{ flex:1, padding:'12px 16px', borderRadius:10,
              background: invalidRows.length > 0 ? '#FEE2E2' : 'var(--bg)',
              border: `1px solid ${invalidRows.length > 0 ? '#FCA5A5' : 'var(--border)'}` }}>
              <div style={{ fontSize:22, fontWeight:800, color: invalidRows.length > 0 ? 'var(--error)' : 'var(--subtle)' }}>{invalidRows.length}</div>
              <div style={{ fontSize:12, color: invalidRows.length > 0 ? 'var(--error)' : 'var(--subtle)', fontWeight:600 }}>Con errores — se omitirán</div>
            </div>
          </div>

          <div style={{ maxHeight:280, overflow:'auto', borderRadius:10, border:'1px solid var(--border)', marginBottom:16 }}>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:12 }}>
              <thead>
                <tr style={{ background:'var(--bg-alt)', position:'sticky', top:0 }}>
                  {['#','Nombre','Email','Rol','Área','Institución','Estado'].map(h => (
                    <th key={h} style={{ padding:'8px 10px', fontSize:10, fontWeight:700, color:'var(--muted)',
                      textAlign:'left', borderBottom:'1px solid var(--border)', whiteSpace:'nowrap',
                      textTransform:'uppercase', letterSpacing:.7 }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map(row => {
                  const area = AREAS.find(a => a.id === row._area);
                  return (
                    <tr key={row._i} style={{ borderBottom:'1px solid var(--border)', background: row._valid ? 'transparent' : '#FFF5F5' }}>
                      <td style={{ padding:'7px 10px', color:'var(--subtle)' }}>{row._i}</td>
                      <td style={{ padding:'7px 10px', fontWeight:600, color:'var(--dark)' }}>{row.nombre||'—'}</td>
                      <td style={{ padding:'7px 10px', color:'var(--muted)', fontSize:11 }}>{row.email||'—'}</td>
                      <td style={{ padding:'7px 10px' }}>
                        <span style={{ padding:'2px 7px', borderRadius:4, fontWeight:700, fontSize:10,
                          background: row._role === 'student' ? 'var(--orange-bg)' : '#CCFBF1',
                          color: row._role === 'student' ? 'var(--orange)' : 'var(--success)' }}>
                          {row._role === 'student' ? 'Estudiante' : 'Instructor'}
                        </span>
                      </td>
                      <td style={{ padding:'7px 10px', color: area ? area.color : 'var(--subtle)', fontWeight:500 }}>
                        {area ? `${area.icon} ${area.name}` : '—'}
                      </td>
                      <td style={{ padding:'7px 10px', color:'var(--muted)', fontSize:11 }}>{row.institucion||'—'}</td>
                      <td style={{ padding:'7px 10px' }}>
                        {row._valid
                          ? <span style={{ fontSize:10, fontWeight:700, color:'var(--success)', background:'#CCFBF1', padding:'2px 7px', borderRadius:4 }}>✓ OK</span>
                          : <span title={row._errors.join('\n')} style={{ fontSize:10, fontWeight:700, color:'var(--error)', background:'#FEE2E2', padding:'2px 7px', borderRadius:4, cursor:'help', whiteSpace:'nowrap' }}>✗ Error</span>
                        }
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {invalidRows.length > 0 && (
            <div style={{ marginBottom:16, padding:'12px 16px', borderRadius:10, background:'#FFFBEB', border:'1px solid #FDE68A' }}>
              <p style={{ fontSize:12, fontWeight:700, color:'var(--warn)', marginBottom:6 }}>Errores encontrados:</p>
              {invalidRows.slice(0,3).map(row => (
                <p key={row._i} style={{ fontSize:11, color:'var(--text-sec)', lineHeight:1.5 }}>
                  <strong>Fila {row._i}:</strong> {row._errors.join(' · ')}
                </p>
              ))}
              {invalidRows.length > 3 && <p style={{ fontSize:11, color:'var(--muted)', marginTop:4 }}>…y {invalidRows.length - 3} más.</p>}
            </div>
          )}

          <div style={{ display:'flex', gap:10 }}>
            <button onClick={() => { setStep(1); setRows([]); if(fileRef.current) fileRef.current.value=''; }}
              style={{ padding:'10px 18px', borderRadius:10, border:'1.5px solid var(--border)', background:'var(--white)',
                color:'var(--text-sec)', fontFamily:'var(--font)', fontSize:13, fontWeight:600, cursor:'pointer' }}>
              Cambiar archivo
            </button>
            <Btn variant="gradient" full disabled={validRows.length === 0} onClick={handleImport}>
              Importar {validRows.length} usuario{validRows.length !== 1 ? 's' : ''}
            </Btn>
          </div>
        </div>
      )}

      {/* Step 3: Done */}
      {step === 3 && (
        <div style={{ textAlign:'center', padding:'24px 0' }}>
          <div style={{ fontSize:64, marginBottom:16 }}>🎉</div>
          <h3 style={{ fontSize:22, fontWeight:800, color:'var(--dark)', marginBottom:8 }}>¡Importación exitosa!</h3>
          <p style={{ fontSize:14, color:'var(--muted)', marginBottom:28, lineHeight:1.6 }}>
            Se crearon <strong style={{ color:'var(--orange)' }}>{importCount} usuarios</strong> en la plataforma.
          </p>
          <Btn variant="gradient" onClick={handleClose}>Listo</Btn>
        </div>
      )}
    </Modal>
  );
};

// =============================================
// INSTRUCTOR ASSIGNMENT PANEL
// =============================================
const InstructorAssignmentPanel = () => {
  const accounts              = useStore(s => s.accounts);
  const institutions          = useStore(s => s.institutions || []);
  const instructorInstitutions = useStore(s => s.instructorInstitutions || []);
  const namedRoutes           = useStore(s => s.namedRoutes || []);

  const instructors = React.useMemo(() => accounts.filter(a => a.role === 'instructor'), [accounts]);

  const [selectedInstructor, setSelectedInstructor] = React.useState('');
  const [saving, setSaving] = React.useState(false);

  const assignedIds = React.useMemo(() =>
    instructorInstitutions.filter(ii => ii.instructor_id === selectedInstructor).map(ii => ii.institution_id),
    [instructorInstitutions, selectedInstructor]
  );

  const toggleInstitution = async (instId) => {
    if (!selectedInstructor) return;
    setSaving(true);
    if (assignedIds.includes(instId)) {
      await removeInstructorInstitution(selectedInstructor, instId);
    } else {
      await assignInstructorInstitution(selectedInstructor, instId);
    }
    setSaving(false);
  };

  const inputSt = { width:'100%', padding:'9px 12px', borderRadius:9, border:'1.5px solid var(--border)', fontFamily:'var(--font)', fontSize:14, outline:'none', background:'var(--white)', boxSizing:'border-box' };

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>
        {/* Selector instructor */}
        <div>
          <label style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, display:'block', marginBottom:6 }}>Instructor</label>
          <select value={selectedInstructor} onChange={e => setSelectedInstructor(e.target.value)} style={inputSt}>
            <option value="">— Selecciona un instructor —</option>
            {instructors.map(inst => <option key={inst.id} value={inst.id}>{inst.name} ({inst.email})</option>)}
          </select>
          {selectedInstructor && (
            <div style={{ marginTop:12 }}>
              <div style={{ fontSize:12, fontWeight:700, color:'var(--dark)', marginBottom:8 }}>Colegios asignados:</div>
              {institutions.length === 0 && <p style={{ fontSize:12, color:'var(--muted)' }}>No hay colegios registrados.</p>}
              <div style={{ display:'flex', flexDirection:'column', gap:6 }}>
                {institutions.map(inst => {
                  const checked = assignedIds.includes(inst.id);
                  return (
                    <label key={inst.id} style={{ display:'flex', alignItems:'center', gap:10, padding:'10px 14px', borderRadius:10,
                      border: checked ? '1.5px solid var(--success)' : '1px solid var(--border)',
                      background: checked ? '#F0FDFA' : 'var(--bg)', cursor:'pointer', transition:'all .15s' }}>
                      <input type="checkbox" checked={checked} disabled={saving} onChange={() => toggleInstitution(inst.id)}
                        style={{ accentColor:'var(--success)', width:16, height:16 }} />
                      <span style={{ fontSize:13, fontWeight: checked ? 600 : 400, color:'var(--dark)' }}>{inst.name}</span>
                      {checked && <CheckIc s={14} c="var(--success)" />}
                    </label>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Resumen por instructor */}
        <div>
          <div style={{ fontSize:11, fontWeight:700, color:'var(--muted)', textTransform:'uppercase', letterSpacing:1, marginBottom:8 }}>Resumen</div>
          {instructors.length === 0 && <p style={{ fontSize:12, color:'var(--muted)' }}>No hay instructores.</p>}
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {instructors.map(instr => {
              const ids = instructorInstitutions.filter(ii => ii.instructor_id === instr.id).map(ii => ii.institution_id);
              const names = ids.map(id => institutions.find(i => i.id === id)?.name).filter(Boolean);
              return (
                <div key={instr.id} style={{ padding:'10px 14px', borderRadius:10, background:'var(--bg-alt)', border:'1px solid var(--border)' }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'var(--dark)', marginBottom:3 }}>{instr.name}</div>
                  {names.length === 0
                    ? <span style={{ fontSize:11, color:'var(--subtle)' }}>Sin colegios asignados</span>
                    : <div style={{ display:'flex', flexWrap:'wrap', gap:4 }}>
                        {names.map(n => <span key={n} style={{ fontSize:11, padding:'2px 8px', borderRadius:6, background:'#CCFBF1', color:'var(--success)', fontWeight:600 }}>{n}</span>)}
                      </div>
                  }
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Rutas por colegio */}
      {namedRoutes.length > 0 && (
        <div style={{ marginTop:24, paddingTop:20, borderTop:'1px solid var(--border)' }}>
          <h4 style={{ fontSize:14, fontWeight:700, color:'var(--dark)', marginBottom:12 }}>📚 Rutas de formación guardadas</h4>
          <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
            {namedRoutes.map(route => {
              const area = AREAS.find(a => a.id === route.area);
              const inst = institutions.find(i => i.id === route.institution_id);
              return (
                <div key={route.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'10px 16px', borderRadius:10, background:'var(--bg-alt)', border:'1px solid var(--border)' }}>
                  <span style={{ fontSize:18 }}>{area?.icon || '📖'}</span>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'var(--dark)' }}>{route.name}</div>
                    <div style={{ fontSize:11, color:'var(--muted)' }}>{area?.name || route.area}</div>
                  </div>
                  <select defaultValue={route.institution_id || ''}
                    onChange={async e => { await assignRouteToInstitution(route.id, e.target.value || null); }}
                    style={{ padding:'6px 10px', borderRadius:8, border:'1px solid var(--border)', fontFamily:'var(--font)', fontSize:12, outline:'none', background:'var(--white)' }}>
                    <option value="">— Sin colegio —</option>
                    {institutions.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
                  </select>
                  {inst && <span style={{ fontSize:11, padding:'3px 8px', borderRadius:6, background:'#EFF6FF', color:'#1D4ED8', fontWeight:600 }}>{inst.name}</span>}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

// =============================================
// MODAL: ACCESO A CURSOS POR USUARIO
// =============================================
const UserCoursesModal = ({ acc, onClose }) => {
  const courses     = useStore(s => s.courses || []);
  const userCourses = useStore(s => s.userCourses || []);
  const [savingId, setSavingId] = React.useState(null);
  const [error, setError] = React.useState(null);

  // Solo cursos base (isBaseCourse): los forks no se asignan a mano — se aplican solos al colegio.
  const activeCourses = React.useMemo(() => courses.filter(isBaseCourse), [courses]);
  const granted = React.useMemo(
    () => new Set(userCourses.filter(uc => uc.user_id === acc?.id && uc.is_active).map(uc => uc.course_id)),
    [userCourses, acc]
  );

  const toggle = async (courseId) => {
    setError(null);
    setSavingId(courseId);
    const res = await setUserCourseAccess(acc.id, courseId, !granted.has(courseId));
    setSavingId(null);
    if (res?.error) setError(res.error);
  };

  return (
    <Modal open={!!acc} onClose={onClose} title="Acceso a cursos" width={460}>
      {acc && (
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10,
            background:'var(--bg-alt)', marginBottom:18 }}>
            <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', background:'var(--orange-bg)',
              display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'var(--orange)' }}>
              {acc.avatar?.startsWith('http')
                ? <img src={acc.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                : acc.avatar}
            </div>
            <div>
              <div style={{ fontSize:14, fontWeight:600, color:'var(--dark)' }}>{acc.name}</div>
              <div style={{ fontSize:12, color:'var(--muted)' }}>{acc.email}</div>
            </div>
          </div>

          <p style={{ fontSize:13, color:'var(--muted)', marginBottom:14, lineHeight:1.5 }}>
            Marca los cursos a los que este usuario puede acceder. Sin cursos marcados, no verá ninguno.
          </p>

          {!acc.id ? (
            <div style={{ padding:'14px 16px', borderRadius:10, background:'#FEF3C7', border:'1px solid #FDE68A',
              fontSize:13, color:'#92400E', lineHeight:1.5 }}>
              Esta cuenta se acaba de crear. Recarga la página para poder asignarle cursos.
            </div>
          ) : activeCourses.length === 0 ? (
            <div style={{ padding:'14px 16px', borderRadius:10, background:'#FEF3C7', border:'1px solid #FDE68A',
              fontSize:13, color:'#92400E' }}>
              No hay cursos activos. Crea o activa cursos en <strong>Gestor de Cursos</strong> primero.
            </div>
          ) : (
            <div style={{ display:'flex', flexDirection:'column', gap:8, maxHeight:340, overflow:'auto', marginBottom:8 }}>
              {activeCourses.map(course => {
                const checked = granted.has(course.id);
                return (
                  <label key={course.id} style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 14px', borderRadius:12,
                    border: checked ? '1.5px solid var(--success)' : '1.5px solid var(--border)',
                    background: checked ? '#F0FDFA' : 'var(--white)', cursor:'pointer', transition:'all .15s',
                    opacity: savingId === course.id ? .6 : 1 }}>
                    <input type="checkbox" checked={checked} disabled={savingId === course.id}
                      onChange={() => toggle(course.id)}
                      style={{ accentColor:'var(--success)', width:16, height:16 }} />
                    <span style={{ width:30, height:30, borderRadius:8, flexShrink:0, display:'flex', alignItems:'center',
                      justifyContent:'center', fontSize:15, background:(course.color || 'var(--orange)') + '20' }}>
                      {course.cover_image ? <img src={course.cover_image} alt="" style={{ width:'100%', height:'100%', objectFit:'cover', borderRadius:7 }} /> : '📖'}
                    </span>
                    <span style={{ flex:1, fontSize:14, fontWeight: checked ? 600 : 500, color:'var(--dark)' }}>{course.name}</span>
                    {checked && <CheckIc s={16} c="var(--success)" />}
                  </label>
                );
              })}
            </div>
          )}

          {error && (
            <div style={{ marginTop:12, padding:'10px 14px', borderRadius:10, background:'var(--error-bg)',
              border:'1px solid var(--error)', fontSize:12, color:'var(--error)', lineHeight:1.5 }}>
              No se pudo guardar: {error}. Si menciona permisos o que la tabla no existe, aplica las migraciones
              <strong> 0018</strong> y <strong>0019</strong> en el SQL Editor de Supabase.
            </div>
          )}

          <div style={{ marginTop:18 }}>
            <Btn variant="gradient" full onClick={onClose}>Listo</Btn>
          </div>
        </div>
      )}
    </Modal>
  );
};

// =============================================
// ADMIN PANEL / USERS MANAGEMENT
// =============================================
const AdminPage = () => {
  const accounts = useStore(s => s.accounts);
  const institutions = useStore(s => s.institutions || INITIAL_INSTITUTIONS);
  const courses = useStore(s => s.courses || []);
  const userCourses = useStore(s => s.userCourses || []);
  const isMobile = useMobile();

  // --- Create form ---
  const [showCreate, setShowCreate] = React.useState(false);
  const [showBulk, setShowBulk] = React.useState(false);
  const [form, setForm] = React.useState({ name:'', email:'', pass:'', role:'student', area:'', institution:'' });
  const [errors, setErrors] = React.useState({});
  const [created, setCreated] = React.useState(false);

  // --- Recordatorios ---
  const [sendingReminders, setSendingReminders] = React.useState(false);
  const [reminderResult, setReminderResult] = React.useState(null);
  const handleSendReminders = async () => {
    setSendingReminders(true);
    setReminderResult(null);
    try {
      const { data, error } = await supabase.functions.invoke('send-reminders', {});
      if (error) setReminderResult({ ok: false, msg: error.message });
      else setReminderResult({ ok: true, msg: `✅ ${data?.sent ?? 0} recordatorio${data?.sent !== 1 ? 's' : ''} enviado${data?.sent !== 1 ? 's' : ''} de ${data?.total ?? 0} docentes inactivos` });
    } catch (e) {
      setReminderResult({ ok: false, msg: e.message });
    }
    setSendingReminders(false);
    setTimeout(() => setReminderResult(null), 6000);
  };

  // --- Delete ---
  const [deleteConfirm, setDeleteConfirm] = React.useState(null);

  // --- Reset progress ---
  const [resetConfirm, setResetConfirm] = React.useState(null);
  const [resetting, setResetting] = React.useState(false);
  const [resetError, setResetError] = React.useState('');
  const [resetDone, setResetDone] = React.useState(false);
  const handleResetProgress = async () => {
    if (!resetConfirm) return;
    setResetting(true);
    setResetError('');
    const res = await resetStudentProgress(resetConfirm.id, resetConfirm.email);
    setResetting(false);
    if (res?.error) { setResetError(res.error); return; }
    setResetDone(true);
    setTimeout(() => { setResetConfirm(null); setResetDone(false); }, 1200);
  };

  // --- Edit area ---
  const [editAreaEmail, setEditAreaEmail] = React.useState(null);
  const [editAreaValue, setEditAreaValue] = React.useState('');

  // --- Edit institution ---
  const [editInstEmail, setEditInstEmail] = React.useState(null);
  const [editInstValue, setEditInstValue] = React.useState('');

  // --- Acceso a cursos por usuario ---
  const [coursesAcc, setCoursesAcc] = React.useState(null);

  // --- Filter / Search ---
  const [search, setSearch] = React.useState('');
  const [filterRole, setFilterRole] = React.useState('all');
  const [filterInstitution, setFilterInstitution] = React.useState('all');
  const [filterStatus, setFilterStatus] = React.useState('all'); // all | active | inactive

  const roleColor = { student:'var(--orange)', instructor:'var(--success)', admin:'var(--purple)' };
  const roleLabel = { student:'Estudiante', instructor:'Instructor', admin:'Admin' };
  const roleBg    = { student:'var(--orange-bg)', instructor:'var(--success-bg, #CCFBF1)', admin:'var(--purple-bg)' };

  // Filtered + searched accounts
  const visibleAccounts = React.useMemo(() => {
    const q = search.trim().toLowerCase();
    return accounts.filter(a => {
      if (filterRole !== 'all' && a.role !== filterRole) return false;
      if (filterInstitution !== 'all' && (a.institution || '') !== filterInstitution) return false;
      if (filterStatus === 'active' && a.is_active === false) return false;
      if (filterStatus === 'inactive' && a.is_active !== false) return false;
      if (!q) return true;
      return (
        a.name.toLowerCase().includes(q) ||
        a.email.toLowerCase().includes(q) ||
        (a.institution || '').toLowerCase().includes(q)
      );
    });
  }, [accounts, filterRole, filterInstitution, filterStatus, search]);

  // --- Paginación ---
  const { paged: pagedAccounts, page, pages, setPage, total } = usePaged(visibleAccounts, 25);

  // --- Selección múltiple + acciones en masa ---
  const [selected, setSelected] = React.useState(() => new Set()); // emails (estable aunque falte id)
  const [bulkBusy, setBulkBusy] = React.useState(false);
  const [bulkInstOpen, setBulkInstOpen] = React.useState(false);
  const [bulkInstValue, setBulkInstValue] = React.useState('');

  // Solo cuentas gestionables: no-admin (el id puede faltar en recién creadas)
  const selectableEmails = React.useMemo(
    () => visibleAccounts.filter(a => a.role !== 'admin').map(a => a.email),
    [visibleAccounts]
  );
  const selectedAccounts = React.useMemo(
    () => accounts.filter(a => selected.has(a.email)),
    [accounts, selected]
  );
  const selectedIds = React.useMemo(
    () => selectedAccounts.map(a => a.id).filter(Boolean),
    [selectedAccounts]
  );
  const allFilteredSelected = selectableEmails.length > 0 && selectableEmails.every(e => selected.has(e));

  const toggleSelect = (email) => setSelected(prev => {
    const next = new Set(prev);
    if (next.has(email)) next.delete(email); else next.add(email);
    return next;
  });
  const toggleSelectAll = () => setSelected(allFilteredSelected ? new Set() : new Set(selectableEmails));
  const clearSelection = () => setSelected(new Set());

  // Solo cursos base (isBaseCourse): los forks no se asignan a mano — se aplican solos al colegio.
  const activeCourses = React.useMemo(() => courses.filter(isBaseCourse), [courses]);
  // Estado tri-estado de un curso sobre la selección: 'all' | 'some' | 'none'
  const courseGroupState = React.useCallback((courseId) => {
    if (!selectedIds.length) return 'none';
    const granted = new Set(
      userCourses.filter(uc => uc.course_id === courseId && uc.is_active).map(uc => uc.user_id)
    );
    const n = selectedIds.filter(id => granted.has(id)).length;
    return n === 0 ? 'none' : n === selectedIds.length ? 'all' : 'some';
  }, [selectedIds, userCourses]);

  const handleBulkCourse = async (course, nextActive) => {
    if (!selectedIds.length) return;
    setBulkBusy(true);
    await setUserCourseAccessBulk(selectedIds, course.id, nextActive);
    setBulkBusy(false);
  };
  const handleBulkActive = async (active) => {
    setBulkBusy(true);
    for (const id of selectedIds) await setAccountActive(id, active);
    setBulkBusy(false);
  };
  const handleBulkInstitution = () => {
    selectedAccounts.forEach(a => changeAccountInstitution(a.email, bulkInstValue));
    setBulkInstOpen(false);
    setBulkInstValue('');
  };

  // Nº de cursos activos por usuario (columna Cursos)
  const courseCountByUser = React.useMemo(() => {
    const map = {};
    userCourses.forEach(uc => { if (uc.is_active) map[uc.user_id] = (map[uc.user_id] || 0) + 1; });
    return map;
  }, [userCourses]);

  const students    = React.useMemo(() => accounts.filter(a => a.role === 'student'), [accounts]);
  const instructors = React.useMemo(() => accounts.filter(a => a.role === 'instructor'), [accounts]);

  const inputSt = (hasErr) => ({
    width:'100%', padding:'10px 14px', borderRadius:10, boxSizing:'border-box',
    border: hasErr ? '1.5px solid var(--error)' : '1.5px solid var(--border)',
    fontFamily:'var(--font)', fontSize:14, outline:'none', background:'var(--white)',
  });

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Nombre requerido';
    if (!form.email.trim() || !form.email.includes('@')) e.email = 'Email inválido';
    if (accounts.some(a => a.email === form.email.trim())) e.email = 'Este email ya existe';
    if (!form.pass || form.pass.length < 4) e.pass = 'Mínimo 4 caracteres';
    if (form.role === 'student' && !form.institution) e.institution = 'La institución es obligatoria para estudiantes';
    if (form.role === 'student' && !form.area) e.area = 'El área es obligatoria para estudiantes';
    return e;
  };

  const [creating, setCreating] = React.useState(false);
  const handleCreate = async () => {
    const e = validate();
    if (Object.keys(e).length > 0) { setErrors(e); return; }
    setCreating(true);
    const res = await createAccount(form.name.trim(), form.email.trim(), form.pass, form.role, form.area || null, form.institution.trim() || '');
    setCreating(false);
    if (res?.error) { setErrors({ server: res.error }); return; }
    setCreated(true);
    setTimeout(() => setCreated(false), 2500);
    setShowCreate(false);
    setForm({ name:'', email:'', pass:'', role:'student', area:'', institution:'' });
    setErrors({});
  };

  // Modo clon — piloto TEMPORAL (0051). NO es un rol: es la variante de interfaz
  // `profiles.ui_variant`. La cuenta conserva sus permisos de student/instructor
  // y solo cambia el menú y las páginas que ve.
  const toggleClone = async (acc, isClone) => {
    const { error } = await setAccountUiVariant(acc.id, isClone ? null : 'clone');
    if (error) window.alert(
      'No se pudo cambiar el modo clon: ' + error +
      '\n\nSi dice que la columna ui_variant no existe, falta correr la migración 0051 en Supabase.');
  };

  const handleEditArea = () => {
    if (!editAreaEmail || !editAreaValue) return;
    changeAccountArea(editAreaEmail, editAreaValue);
    setEditAreaEmail(null);
    setEditAreaValue('');
  };

  const openEditArea = (acc) => {
    setEditAreaEmail(acc.email);
    setEditAreaValue(acc.area || '');
  };

  const openEditInstitution = (acc) => {
    setEditInstEmail(acc.email);
    setEditInstValue(acc.institution || '');
  };

  const handleEditInstitution = () => {
    if (!editInstEmail) return;
    changeAccountInstitution(editInstEmail, editInstValue);
    setEditInstEmail(null);
    setEditInstValue('');
  };

  return (
    <div style={{ height:'100%', overflow:'auto', WebkitOverflowScrolling:'touch', padding: isMobile ? '0 16px 40px' : '0 24px 40px' }}>
      <PageHead title="Gestión de Usuarios" subtitle="Crea, busca y administra cuentas de la plataforma">
        <div style={{ display:'flex', flexDirection:'column', alignItems:'flex-end', gap:6 }}>
          <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
            <button onClick={handleSendReminders} disabled={sendingReminders}
              style={{ display:'flex', alignItems:'center', gap:8, padding:'9px 16px', borderRadius:10,
                border:'1.5px solid var(--purple)', background: sendingReminders ? 'var(--purple-bg)' : 'var(--white)',
                color:'var(--purple)', fontFamily:'var(--font)', fontSize:13, fontWeight:600,
                cursor: sendingReminders ? 'not-allowed' : 'pointer', transition:'all .2s', opacity: sendingReminders ? .7 : 1 }}>
              {sendingReminders ? '⏳ Enviando...' : '📧 Enviar recordatorios'}
            </button>
            <Btn variant="secondary" onClick={() => setShowBulk(true)}>
              <UploadIc s={16} c="var(--text-sec)" /> Carga masiva
            </Btn>
            <Btn variant="gradient" onClick={() => setShowCreate(true)}>
              <PlusIc s={16} c="#fff" /> Nueva cuenta
            </Btn>
          </div>
          {reminderResult && (
            <div style={{ fontSize:12, fontWeight:600, padding:'6px 12px', borderRadius:8, maxWidth:280, textAlign:'right',
              background: reminderResult.ok ? 'var(--success-bg, #CCFBF1)' : 'var(--error-bg, #FEE2E2)',
              color: reminderResult.ok ? 'var(--success)' : 'var(--error)',
              border: `1px solid ${reminderResult.ok ? 'var(--success-border, #5EEAD4)' : 'var(--error)'}` }}>
              {reminderResult.msg}
            </div>
          )}
        </div>
      </PageHead>

      {created && (
        <div style={{ padding:'12px 18px', borderRadius:12, background:'var(--success-bg, #CCFBF1)', border:'1px solid var(--success-border, #5EEAD4)',
          marginBottom:16, display:'flex', alignItems:'center', gap:10, animation:'fadeUp .3s ease' }}>
          <CheckIc s={18} c="var(--success)" />
          <span style={{ fontSize:14, fontWeight:600, color:'var(--success)' }}>Cuenta creada exitosamente</span>
        </div>
      )}

      <StatsRow stats={[
        { label:'Estudiantes',  value:students.length,    color:'var(--orange)' },
        { label:'Instructores', value:instructors.length, color:'var(--success)' },
        { label:'Cuentas inactivas', value:accounts.filter(a => a.is_active === false).length, color:'var(--error)' },
        { label:'Total cuentas', value:accounts.length,   color:'var(--purple)' },
      ]} />

      {/* Search + filter row */}
      <div style={{ display:'flex', gap:10, marginBottom:16, flexWrap:'wrap', alignItems:'center' }}>
        <SearchInput value={search} onChange={setSearch} placeholder="Buscar por nombre, email o institución..." />
        <SegmentedTabs active={filterRole} onChange={setFilterRole} tabs={[
          { key:'all',        label:`Todos (${accounts.length})` },
          { key:'student',    label:`Estudiantes (${students.length})` },
          { key:'instructor', label:`Instructores (${instructors.length})` },
        ]} />
        {/* Institution filter */}
        <select value={filterInstitution} onChange={e => setFilterInstitution(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--white)',
            fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text-sec)', outline:'none',
            cursor:'pointer', maxWidth:200 }}>
          <option value="all">🏫 Todos los colegios</option>
          {institutions.map(inst => <option key={inst.id} value={inst.name}>{inst.name}</option>)}
        </select>
        {/* Status filter */}
        <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
          style={{ padding:'8px 12px', borderRadius:8, border:'1.5px solid var(--border)', background:'var(--white)',
            fontFamily:'var(--font)', fontSize:12, fontWeight:600, color:'var(--text-sec)', outline:'none', cursor:'pointer' }}>
          <option value="all">Estado: todos</option>
          <option value="active">✅ Activos</option>
          <option value="inactive">🚫 Inactivos</option>
        </select>
      </div>

      {/* Accounts table */}
      <div style={{ borderRadius:14, border:'1px solid var(--border)', background:'var(--white)',
        overflow:'hidden', overflowX:'auto', WebkitOverflowScrolling:'touch' }}>
        <table style={{ width:'100%', borderCollapse:'collapse', minWidth:680 }}>
          <thead>
            <tr style={{ background:'var(--bg-alt)' }}>
              <th style={{ padding:'10px 8px 10px 14px', borderBottom:'1.5px solid var(--border)', width:34 }}>
                <input type="checkbox" checked={allFilteredSelected} onChange={toggleSelectAll}
                  title="Seleccionar todos los filtrados"
                  style={{ accentColor:'var(--orange)', width:15, height:15, cursor:'pointer' }} />
              </th>
              {['Usuario','Institución','Rol','Área','Cursos','Acciones'].map(h => (
                <th key={h} style={{ padding:'10px 14px', fontSize:11, fontWeight:700, color:'var(--muted)',
                  textTransform:'uppercase', letterSpacing:.8, textAlign:'left',
                  borderBottom:'1.5px solid var(--border)', whiteSpace:'nowrap' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {visibleAccounts.length === 0 && (
              <tr><td colSpan={7} style={{ padding:'32px', textAlign:'center', color:'var(--muted)', fontSize:14 }}>
                No se encontraron cuentas con ese criterio.
              </td></tr>
            )}
            {pagedAccounts.map(acc => {
              const area = AREAS.find(a => a.id === acc.area);
              const isAdmin = acc.role === 'admin';
              const isStudent = acc.role === 'student';
              const isActive = acc.is_active !== false;
              const isClone = acc.ui_variant === 'clone';
              const isSel = selected.has(acc.email);
              const nCourses = acc.id ? (courseCountByUser[acc.id] || 0) : 0;
              return (
                <tr key={acc.email} style={{ borderBottom:'1px solid var(--border)', transition:'background .15s',
                  opacity: isActive ? 1 : .55, background: isSel ? 'var(--orange-bg)' : 'transparent' }}
                  onMouseEnter={e => { if (!isSel) e.currentTarget.style.background = 'var(--bg)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isSel ? 'var(--orange-bg)' : 'transparent'; }}>
                  <td style={{ padding:'11px 8px 11px 14px' }}>
                    {!isAdmin && (
                      <input type="checkbox" checked={isSel} onChange={() => toggleSelect(acc.email)}
                        style={{ accentColor:'var(--orange)', width:15, height:15, cursor:'pointer' }} />
                    )}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                      <UserAvatar acc={acc} bg={roleBg[acc.role]} color={roleColor[acc.role]} />
                      <div style={{ minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                          <span style={{ fontSize:13, fontWeight:600, color:'var(--dark)' }}>{acc.name}</span>
                          {!isActive && <Pill tone="error" style={{ borderRadius:6 }}>Inactivo</Pill>}
                          {isClone && <Pill tone="purple" style={{ borderRadius:6 }} title="Modo clon: interfaz del piloto temporal">🧬 Clon</Pill>}
                        </div>
                        <div style={{ fontSize:11.5, color:'var(--muted)', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{acc.email}</div>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding:'11px 14px', fontSize:12, color:'var(--purple-deep)', fontWeight:500 }}>
                    {acc.institution ? `🏫 ${acc.institution}` : <span style={{ color:'var(--subtle)' }}>—</span>}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    <span style={{ fontSize:11, fontWeight:700, padding:'3px 9px', borderRadius:6,
                      background: roleBg[acc.role], color: roleColor[acc.role], whiteSpace:'nowrap' }}>
                      {roleLabel[acc.role]}
                    </span>
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    {area ? (
                      <span style={{ fontSize:12, color: area.color, fontWeight:600, whiteSpace:'nowrap' }}>
                        {area.icon} {area.name}
                      </span>
                    ) : (
                      <span style={{ fontSize:12, color:'var(--subtle)' }}>—</span>
                    )}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    {isAdmin ? (
                      <span style={{ fontSize:12, color:'var(--subtle)' }}>—</span>
                    ) : (
                      <Pill tone={nCourses > 0 ? 'success' : 'muted'} onClick={() => setCoursesAcc(acc)}
                        title="Gestionar acceso a cursos">
                        📚 {nCourses}
                      </Pill>
                    )}
                  </td>
                  <td style={{ padding:'11px 14px' }}>
                    {isAdmin ? (
                      <span style={{ fontSize:11, color:'var(--subtle)' }}>—</span>
                    ) : (
                      <RowMenu items={[
                        { icon:'📚', label:'Cursos',            onClick:() => setCoursesAcc(acc) },
                        ...(isStudent ? [{ icon:'✏️', label:'Editar área',       onClick:() => openEditArea(acc) }] : []),
                        { icon:'🏫', label:'Cambiar colegio',   onClick:() => openEditInstitution(acc) },
                        ...(isStudent ? [{ icon:'🔄', label:'Resetear progreso', onClick:() => setResetConfirm(acc) }] : []),
                        // Modo clon: piloto TEMPORAL (0051). No cambia permisos,
                        // solo la interfaz que ve la cuenta.
                        { icon: isClone ? '🧪' : '🧬',
                          label: isClone ? 'Quitar modo clon' : 'Activar modo clon',
                          onClick:() => toggleClone(acc, isClone) },
                        { icon: isActive ? '🚫' : '✅', label: isActive ? 'Desactivar' : 'Activar', onClick:() => setAccountActive(acc.id, !isActive) },
                        { icon:'🗑️', label:'Eliminar', danger:true, onClick:() => setDeleteConfirm(acc.email) },
                      ]} />
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pages={pages} setPage={setPage} total={total} label="cuentas" />

      {/* Barra de acciones en masa (aparece al seleccionar) */}
      {selected.size > 0 && (
        <div style={{ position:'fixed', bottom:20, left:'50%', transform:'translateX(-50%)', zIndex:900,
          display:'flex', alignItems:'center', gap:10, flexWrap:'wrap', justifyContent:'center',
          padding:'10px 16px', borderRadius:14, background:'var(--white)', border:'1px solid var(--border)',
          boxShadow:'var(--sh-lg)', maxWidth:'calc(100vw - 32px)' }}>
          <span style={{ fontSize:13, fontWeight:700, color:'var(--dark)', whiteSpace:'nowrap' }}>
            {selected.size} seleccionado{selected.size !== 1 ? 's' : ''}
          </span>
          <ChecklistDropdown
            label={bulkBusy ? '⏳ Aplicando…' : '📚 Cursos'}
            items={activeCourses.map(c => ({ id: c.id, label: c.name }))}
            stateOf={it => courseGroupState(it.id)}
            onToggle={(it, next) => handleBulkCourse(activeCourses.find(c => c.id === it.id), next)}
            disabled={bulkBusy || selectedIds.length === 0}
            emptyText="No hay cursos activos."
            width={280}
          />
          <Btn variant="secondary" size="sm" disabled={bulkBusy} onClick={() => setBulkInstOpen(true)}>🏫 Cambiar colegio</Btn>
          <Btn variant="secondary" size="sm" disabled={bulkBusy || !selectedIds.length} onClick={() => handleBulkActive(true)}>✅ Activar</Btn>
          <Btn variant="secondary" size="sm" disabled={bulkBusy || !selectedIds.length} onClick={() => handleBulkActive(false)}>🚫 Desactivar</Btn>
          <button onClick={clearSelection}
            style={{ padding:'6px 10px', borderRadius:8, border:'none', background:'none', color:'var(--muted)',
              fontFamily:'var(--font)', fontSize:12, fontWeight:600, cursor:'pointer' }}>✕ Limpiar</button>
        </div>
      )}

      {/* Modal cambiar colegio en masa */}
      <Modal open={bulkInstOpen} onClose={() => setBulkInstOpen(false)} title="Cambiar colegio en masa" width={420}>
        <div>
          <p style={{ fontSize:13, color:'var(--text-sec)', marginBottom:14, lineHeight:1.5 }}>
            Se reasignará el colegio de <strong>{selected.size}</strong> cuenta{selected.size !== 1 ? 's' : ''} seleccionada{selected.size !== 1 ? 's' : ''}.
          </p>
          <select value={bulkInstValue} onChange={e => setBulkInstValue(e.target.value)}
            style={{ ...inputStyle(false), marginBottom:20 }}>
            <option value="">— Sin colegio —</option>
            {institutions.map(inst => <option key={inst.id} value={inst.name}>{inst.name}</option>)}
          </select>
          <div style={{ display:'flex', gap:10 }}>
            <Btn variant="secondary" full onClick={() => setBulkInstOpen(false)}>Cancelar</Btn>
            <Btn variant="gradient" full onClick={handleBulkInstitution}>Aplicar cambio</Btn>
          </div>
        </div>
      </Modal>

      {/* Create modal */}
      <Modal open={showCreate} onClose={() => { setShowCreate(false); setErrors({}); }} title="Crear nueva cuenta" width={480}>
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>Nombre completo</label>
            <input value={form.name} onChange={e => setForm(f=>({...f,name:e.target.value}))}
              placeholder="Ej: María García" style={inputSt(errors.name)} />
            {errors.name && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.name}</p>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>Correo electrónico</label>
            <input value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))}
              placeholder="usuario@ceinfes.com" type="email" style={inputSt(errors.email)} />
            {errors.email && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.email}</p>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>Contraseña</label>
            <input value={form.pass} onChange={e => setForm(f=>({...f,pass:e.target.value}))}
              placeholder="Mínimo 4 caracteres" style={inputSt(errors.pass)} />
            {errors.pass && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.pass}</p>}
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>Rol</label>
            <select value={form.role} onChange={e => setForm(f=>({...f,role:e.target.value,area:'',institution:''}))}
              style={inputSt(false)}>
              <option value="student">Estudiante</option>
              <option value="instructor">Instructor</option>
            </select>
          </div>
          <div>
            <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
              Institución educativa{form.role === 'student' && <span style={{ color:'var(--error)' }}> *</span>}
            </label>
            {institutions.length === 0 ? (
              <div style={{ padding:'10px 14px', borderRadius:10, background:'#FEF3C7', border:'1px solid #FDE68A',
                fontSize:13, color:'#92400E', lineHeight:1.5 }}>
                ⚠️ No hay instituciones registradas. Ve a <strong>Colegios</strong> y crea una institución primero.
              </div>
            ) : (
              <select value={form.institution} onChange={e => setForm(f=>({...f,institution:e.target.value}))}
                style={inputSt(!!errors.institution)}>
                <option value="">— Seleccionar institución —</option>
                {institutions.map(inst => (
                  <option key={inst.id} value={inst.name}>{inst.name}</option>
                ))}
              </select>
            )}
            {errors.institution && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.institution}</p>}
          </div>
          {form.role === 'student' && (
            <div>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:6 }}>
                Área de formación <span style={{ color:'var(--error)' }}>*</span>
              </label>
              <select value={form.area} onChange={e => setForm(f=>({...f,area:e.target.value}))}
                style={inputSt(errors.area)}>
                <option value="">— Seleccionar área —</option>
                {AREAS.map(a => <option key={a.id} value={a.id}>{a.icon} {a.name}</option>)}
              </select>
              {errors.area && <p style={{ fontSize:11, color:'var(--error)', marginTop:4 }}>{errors.area}</p>}
            </div>
          )}
          {errors.server && (
            <div style={{ padding:'10px 14px', borderRadius:10, background:'var(--error-bg)', border:'1px solid var(--error)',
              fontSize:12, color:'var(--error)', lineHeight:1.5 }}>
              No se pudo crear la cuenta: {errors.server}
            </div>
          )}
          <div style={{ display:'flex', gap:10, marginTop:8 }}>
            <Btn variant="secondary" full onClick={() => { setShowCreate(false); setErrors({}); }}>Cancelar</Btn>
            <Btn variant="gradient" full
              disabled={creating || (form.role === 'student' && institutions.length === 0)}
              onClick={handleCreate}>{creating ? 'Creando…' : 'Crear cuenta'}</Btn>
          </div>
        </div>
      </Modal>

      {/* Edit area modal */}
      <Modal open={!!editAreaEmail} onClose={() => setEditAreaEmail(null)} title="Cambiar área del estudiante" width={420}>
        {editAreaEmail && (() => {
          const acc = accounts.find(a => a.email === editAreaEmail);
          return acc ? (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10,
                background:'var(--bg-alt)', marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', background:'var(--orange-bg)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'var(--orange)' }}>
                  {acc.avatar?.startsWith('http')
                    ? <img src={acc.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : acc.avatar}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--dark)' }}>{acc.name}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{acc.email}</div>
                </div>
              </div>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:10 }}>
                Selecciona la nueva área de formación:
              </label>
              <div style={{ display:'flex', flexDirection:'column', gap:8, marginBottom:24 }}>
                {AREAS.map(a => {
                  const isCurrent = a.id === (editAreaValue || acc.area);
                  return (
                    <button key={a.id} onClick={() => setEditAreaValue(a.id)}
                      style={{ display:'flex', alignItems:'center', gap:12, padding:'12px 16px', borderRadius:12,
                        border: isCurrent ? `2px solid ${a.color}` : '1.5px solid var(--border)',
                        background: isCurrent ? a.bg : 'var(--white)', cursor:'pointer',
                        fontFamily:'var(--font)', transition:'all .2s', textAlign:'left' }}
                      onMouseEnter={e => !isCurrent && (e.currentTarget.style.borderColor = a.color)}
                      onMouseLeave={e => !isCurrent && (e.currentTarget.style.borderColor = 'var(--border)')}>
                      <span style={{ fontSize:22 }}>{a.icon}</span>
                      <span style={{ fontSize:14, fontWeight:600, color: isCurrent ? a.color : 'var(--dark)', flex:1 }}>{a.name}</span>
                      {isCurrent && <CheckIc s={16} c={a.color} />}
                    </button>
                  );
                })}
              </div>
              <div style={{ display:'flex', gap:10 }}>
                <Btn variant="secondary" full onClick={() => setEditAreaEmail(null)}>Cancelar</Btn>
                <Btn variant="gradient" full disabled={!editAreaValue || editAreaValue === acc.area} onClick={handleEditArea}>
                  Guardar cambio
                </Btn>
              </div>
            </div>
          ) : null;
        })()}
      </Modal>

      {/* Edit institution modal */}
      <Modal open={!!editInstEmail} onClose={() => setEditInstEmail(null)} title="Reasignar colegio" width={420}>
        {editInstEmail && (() => {
          const acc = accounts.find(a => a.email === editInstEmail);
          return acc ? (
            <div>
              <div style={{ display:'flex', alignItems:'center', gap:10, padding:'12px 16px', borderRadius:10,
                background:'var(--bg-alt)', marginBottom:20 }}>
                <div style={{ width:36, height:36, borderRadius:'50%', overflow:'hidden', background:'var(--purple-bg)',
                  display:'flex', alignItems:'center', justifyContent:'center', fontSize:14, fontWeight:700, color:'var(--purple-deep)' }}>
                  {acc.avatar?.startsWith('http')
                    ? <img src={acc.avatar} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                    : acc.avatar}
                </div>
                <div>
                  <div style={{ fontSize:14, fontWeight:600, color:'var(--dark)' }}>{acc.name}</div>
                  <div style={{ fontSize:12, color:'var(--muted)' }}>{acc.email}</div>
                </div>
              </div>
              <label style={{ fontSize:13, fontWeight:600, color:'var(--dark)', display:'block', marginBottom:10 }}>
                Selecciona el colegio:
              </label>
              {institutions.length === 0 ? (
                <p style={{ fontSize:13, color:'var(--muted)', marginBottom:24 }}>No hay colegios registrados.</p>
              ) : (
                <select value={editInstValue} onChange={e => setEditInstValue(e.target.value)}
                  style={{ ...inputSt(false), marginBottom:24 }}>
                  <option value="">— Sin colegio —</option>
                  {institutions.map(inst => (
                    <option key={inst.id} value={inst.name}>{inst.name}</option>
                  ))}
                </select>
              )}
              <div style={{ display:'flex', gap:10 }}>
                <Btn variant="secondary" full onClick={() => setEditInstEmail(null)}>Cancelar</Btn>
                <Btn variant="gradient" full disabled={editInstValue === (acc.institution || '')} onClick={handleEditInstitution}>
                  Guardar cambio
                </Btn>
              </div>
            </div>
          ) : null;
        })()}
      </Modal>

      {/* Delete confirm modal */}
      <Modal open={!!deleteConfirm} onClose={() => setDeleteConfirm(null)} title="Eliminar cuenta" width={400}>
        <div style={{ textAlign:'center', padding:'8px 0' }}>
          <div style={{ fontSize:40, marginBottom:12 }}>⚠️</div>
          <p style={{ fontSize:14, color:'var(--text-sec)', marginBottom:8, lineHeight:1.6 }}>
            ¿Eliminar la cuenta de <strong>{deleteConfirm}</strong>?
          </p>
          <p style={{ fontSize:12, color:'var(--muted)', marginBottom:24 }}>Esta acción no se puede deshacer.</p>
          <div style={{ display:'flex', gap:10 }}>
            <Btn variant="secondary" full onClick={() => setDeleteConfirm(null)}>Cancelar</Btn>
            <Btn variant="danger" full onClick={() => { deleteAccount(deleteConfirm); setDeleteConfirm(null); }}>
              Eliminar
            </Btn>
          </div>
        </div>
      </Modal>

      {/* Reset progress modal */}
      <Modal open={!!resetConfirm} onClose={() => { setResetConfirm(null); setResetError(''); setResetDone(false); }} title="Resetear progreso" width={420}>
        {resetConfirm && (
          <div style={{ textAlign:'center', padding:'8px 0' }}>
            <div style={{ fontSize:44, marginBottom:12 }}>{resetDone ? '✅' : '🔄'}</div>
            {resetDone ? (
              <p style={{ fontSize:14, color:'var(--success)', fontWeight:700, marginBottom:8 }}>
                Progreso de <strong>{resetConfirm.name}</strong> reiniciado.
              </p>
            ) : (
              <>
                <p style={{ fontSize:14, color:'var(--text-sec)', marginBottom:8, lineHeight:1.6 }}>
                  ¿Resetear todo el progreso de <strong>{resetConfirm.name}</strong>?
                </p>
                <div style={{ padding:'12px 16px', borderRadius:10, background:'#FEF3C7', border:'1px solid #FDE68A', marginBottom:16, textAlign:'left' }}>
                  <p style={{ fontSize:12, color:'#92400E', lineHeight:1.6, margin:0 }}>
                    ⚠️ Se eliminarán sus <strong>módulos completados</strong>, <strong>XP</strong>, <strong>insignias</strong>, <strong>entregas</strong>, <strong>intentos de retos</strong> y su <strong>certificado</strong> (incluido el progreso de todos sus cursos). Esta acción no se puede deshacer.
                  </p>
                </div>
                {resetError && (
                  <div style={{ padding:'10px 14px', borderRadius:8, background:'#FEF2F2', border:'1px solid #FECACA', fontSize:13, color:'var(--error)', marginBottom:16, textAlign:'left' }}>
                    ⚠️ {resetError}
                  </div>
                )}
                <div style={{ display:'flex', gap:10 }}>
                  <Btn variant="secondary" full onClick={() => { setResetConfirm(null); setResetError(''); }}>Cancelar</Btn>
                  <Btn variant="danger" full disabled={resetting} onClick={handleResetProgress}>
                    {resetting ? '⏳ Reseteando...' : 'Resetear progreso'}
                  </Btn>
                </div>
              </>
            )}
          </div>
        )}
      </Modal>

      <BulkUploadModal open={showBulk} onClose={() => setShowBulk(false)} />

      <UserCoursesModal acc={coursesAcc} onClose={() => setCoursesAcc(null)} />

      <div style={{ marginTop:24 }}>
        <Collapsible title="🏫 Asignación de Instructores a Colegios"
          subtitle="Define qué colegios puede gestionar cada instructor (también disponible en Gestión de Colegios)">
          <InstructorAssignmentPanel />
        </Collapsible>
      </div>
    </div>
  );
};

export default AdminPage;
