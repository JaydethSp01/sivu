#!/usr/bin/env python3
"""
Seed de DEMOSTRACIÓN — crea un ciclo de vida COMPLETO de una práctica de
Coformación a través de la API REST de SIVU, para que todas las pantallas
muestren datos reales en la sustentación.

Recorre: HV → aprobación → postulación → entrevista → carta → convenio →
firmas → trimestre → plan de actividades → 3 actas → evaluación tutor +
profesor → plan de mejora → informe final → cierre con nota.

Idempotente-ish: si Kelly ya tiene un convenio, no duplica (sale temprano).

Uso:
    python3 seed-demo-lifecycle.py [BASE_URL]
    BASE_URL por defecto: http://localhost:8081/api/v1
"""
import json, sys, urllib.request, urllib.error
from urllib.parse import urlencode

BASE = sys.argv[1] if len(sys.argv) > 1 else "http://localhost:8081/api/v1"

CREDS = {
    "ADMIN":       {"email": "admin@uempresarial.edu.co",  "password": "Admin123*"},
    "COORDINADOR": {"email": "coord@uempresarial.edu.co",  "password": "Coord123*"},
    "ESTUDIANTE":  {"email": "kelly@est.uempresarial.edu.co", "password": "Estudiante123*"},
    "EMPRESA":     {"email": "rrhh@coally.com",            "password": "Empresa123*"},
}
TOK = {}
G, Y, R, RST = "\033[92m", "\033[93m", "\033[91m", "\033[0m"
def ok(m): print(f"  {G}✓{RST} {m}")
def warn(m): print(f"  {Y}⚠{RST} {m}")
def die(m): print(f"  {R}✗ {m}{RST}"); sys.exit(1)

def req(method, path, role=None, body=None, params=None):
    url = BASE + path + (("?" + urlencode(params)) if params else "")
    headers = {}
    data = None
    if body is not None:
        data = json.dumps(body).encode()
        headers["Content-Type"] = "application/json"
    if role:
        headers["Authorization"] = f"Bearer {TOK[role]}"
    r = urllib.request.Request(url, data=data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as resp:
            raw = resp.read()
            return resp.status, (json.loads(raw) if raw else None)
    except urllib.error.HTTPError as e:
        raw = e.read().decode(errors="replace")
        try: return e.code, json.loads(raw)
        except: return e.code, raw

def login_all():
    for role, c in CREDS.items():
        s, d = req("POST", "/auth/login", body=c)
        if s != 200: die(f"login {role}: {s} {d}")
        TOK[role] = d["accessToken"]
    ok("login de los 4 roles OK")

def main():
    print("=== SEED DEMO: ciclo de vida completo ===\n")
    login_all()

    EST_ID = 1  # Kelly

    # --- guard: ¿ya hay convenio para Kelly? ---
    s, page = req("GET", "/convenios", "COORDINADOR", params={"estudianteId": EST_ID, "page": 0, "size": 1})
    if s == 200 and page.get("totalElements", 0) > 0:
        warn(f"Kelly ya tiene convenio (id={page['content'][0]['id']}). Seed ya aplicado; salgo para no duplicar.")
        return

    # --- IDs base ---
    s, vac = req("GET", "/vacantes", "COORDINADOR", params={"page": 0, "size": 1})
    if s != 200 or not vac.get("content"): die(f"sin vacantes: {s}")
    VAC_ID = vac["content"][0]["id"]
    ok(f"vacante objetivo id={VAC_ID} ({vac['content'][0].get('titulo','')})")

    s, tut = req("GET", "/tutores", "COORDINADOR", params={"page": 0, "size": 20})
    items = tut.get("content", []) if isinstance(tut, dict) else []
    tutor_acad = next((t["id"] for t in items if t.get("tipo") == "ACADEMICO"), None)
    tutor_emp  = next((t["id"] for t in items if t.get("tipo") == "EMPRESARIAL"), None)
    ok(f"tutor académico id={tutor_acad} · tutor empresarial id={tutor_emp}")

    # --- 1. HOJA DE VIDA ---
    hv_body = {
        "direccion": "Cra 7 #45-10", "telefonoContacto": "+57 3001234567", "ciudad": "Bogotá",
        "perfilSaber": "Ingeniera de Sistemas con fundamentos sólidos en estructuras de datos, bases de datos relacionales y NoSQL, y arquitectura de software. Conocimiento en metodologías ágiles.",
        "perfilHacer": "Desarrolla microservicios con Spring Boot, APIs REST, integraciones y pipelines CI/CD con GitHub Actions. Maneja PostgreSQL, Docker y React.",
        "perfilSer": "Comprometida, colaborativa y orientada a resultados. Comunicación asertiva y capacidad de aprendizaje autónomo.",
        "habilidades": [
            {"categoria": "TECNICA", "descripcion": "Java / Spring Boot", "orden": 1},
            {"categoria": "TECNICA", "descripcion": "PostgreSQL y MongoDB", "orden": 2},
            {"categoria": "HERRAMIENTA", "descripcion": "Docker y GitHub Actions", "orden": 3},
            {"categoria": "PERSONAL", "descripcion": "Trabajo en equipo", "orden": 4},
        ],
        "idiomas": [
            {"idioma": "Español", "nivel": "NATIVO", "orden": 1},
            {"idioma": "Inglés", "nivel": "B2", "orden": 2},
        ],
        "educacion": [
            {"programa": "Ingeniería de Sistemas", "institucion": "Uniempresarial",
             "fechaInicio": "2022-01-15", "enCurso": True, "observaciones": "Promedio 4.3", "orden": 1},
        ],
        "experienciaFase": [
            {"empresa": "Coally S.A.S.", "cargo": "Aprendiz de desarrollo",
             "fechaInicio": "2025-01-15", "fechaFin": "2025-06-15", "enCurso": False,
             "descripcion": "Apoyo en módulos backend.", "orden": 1},
        ],
        "experienciaLaboral": [
            {"empresa": "Freelance", "cargo": "Desarrolladora web",
             "fechaInicio": "2024-06-01", "fechaFin": "2024-12-01", "enCurso": False,
             "descripcion": "Sitios con React.", "orden": 1},
        ],
    }
    s, _ = req("PUT", f"/hoja-vida/{EST_ID}", "ESTUDIANTE", body=hv_body)
    if s != 200: die(f"guardar HV: {s} {_}")
    ok("HV completa guardada")
    s, hv = req("POST", f"/hoja-vida/{EST_ID}/enviar-a-coformacion", "ESTUDIANTE")
    if s != 200: die(f"enviar HV: {s} {hv}")
    HV_ID = hv["id"]
    ok(f"HV enviada a Coformación (id={HV_ID})")
    s, _ = req("POST", f"/hoja-vida/{HV_ID}/aprobar", "COORDINADOR")
    if s != 200: die(f"aprobar HV: {s} {_}")
    ok("HV APROBADA por Coformación")

    # --- 2. POSTULACIÓN ---
    s, post = req("POST", "/postulaciones", "ESTUDIANTE",
                  body={"estudianteId": EST_ID, "vacanteId": VAC_ID,
                        "mensajeEstudiante": "Me interesa mucho esta práctica para aplicar mis conocimientos backend."})
    if s not in (200, 201): die(f"postular: {s} {post}")
    POST_ID = post["id"]
    ok(f"postulación creada (id={POST_ID})")

    s, _ = req("PATCH", f"/postulaciones/{POST_ID}/estado", "COORDINADOR",
               body={"nuevoEstado": "EN_REVISION", "observaciones": "En revisión por Coformación"})
    if s != 200: die(f"estado EN_REVISION: {s} {_}")
    ok("postulación → EN_REVISION")

    # --- 3. ENTREVISTA (entidad aparte; aparece en la pantalla Entrevistas) ---
    s, ent = req("POST", "/entrevistas", "COORDINADOR",
                 body={"postulacionId": POST_ID, "fechaProgramada": "2026-06-10T10:00:00-05:00",
                       "modalidad": "VIRTUAL", "enlaceVirtual": "https://meet.google.com/demo-sivu",
                       "entrevistadorNombre": "Andrea Ruiz", "entrevistadorCargo": "Head of Talent",
                       "observaciones": "Entrevista técnica + cultural."})
    if s not in (200, 201): die(f"entrevista: {s} {ent}")
    ENT_ID = ent["id"]
    # El resultado APROBADA mueve la postulación a PRESELECCIONADA automáticamente.
    s, _ = req("PATCH", f"/entrevistas/{ENT_ID}/resultado", "COORDINADOR",
               body={"resultado": "APROBADA", "observaciones": "Excelente desempeño técnico."})
    if s != 200: die(f"resultado entrevista: {s} {_}")
    ok(f"entrevista realizada y APROBADA (id={ENT_ID}) → postulación PRESELECCIONADA")

    s, _ = req("PATCH", f"/postulaciones/{POST_ID}/estado", "COORDINADOR",
               body={"nuevoEstado": "ACEPTADA", "observaciones": "Aceptada para formalizar convenio"})
    if s != 200: die(f"estado ACEPTADA: {s} {_}")
    ok("postulación → ACEPTADA (carta de presentación auto-generada)")

    # --- 4. CARTA DE PRESENTACIÓN ---
    s, _ = req("POST", f"/postulaciones/{POST_ID}/carta-presentacion", "COORDINADOR",
               body={"contenidoExtra": "La estudiante cuenta con el aval de la Oficina de Coformación."})
    if s in (200, 201): ok("carta de presentación generada")
    else: warn(f"carta presentación: {s} {_}")

    # --- 5. CONVENIO ---
    s, conv = req("POST", "/convenios", "COORDINADOR",
                  body={"postulacionId": POST_ID, "estudianteId": EST_ID,
                        "empresaId": vac["content"][0].get("empresaId") or 1, "vacanteId": VAC_ID,
                        "numeroConvenio": "CV-2026-001", "fechaInicio": "2026-07-01",
                        "fechaFin": "2026-12-31"})
    if s not in (200, 201): die(f"convenio: {s} {conv}")
    CONV_ID = conv["id"]
    ok(f"convenio creado (id={CONV_ID})")

    if tutor_acad and tutor_emp:
        s, _ = req("PATCH", f"/convenios/{CONV_ID}/tutores", "COORDINADOR",
                   body={"tutorAcademicoId": tutor_acad, "tutorEmpresarialId": tutor_emp})
        if s == 200: ok("tutores asignados al convenio")
        else: warn(f"asignar tutores: {s} {_}")

    # firmas 3 partes
    sigs = [("ESTUDIANTE", "ESTUDIANTE"), ("EMPRESA", "EMPRESA"), ("UNIVERSIDAD", "COORDINADOR")]
    for parte, role in sigs:
        s, _ = req("PATCH", f"/convenios/{CONV_ID}/firmar/{parte}", role)
        if s != 200: die(f"firmar {parte}: {s} {_}")
    ok("convenio firmado por las 3 partes → ACTIVO")

    # --- 6. TRIMESTRE (auto al firmar, o crear) ---
    s, tris = req("GET", f"/convenios/{CONV_ID}/trimestres", "COORDINADOR")
    tri_list = tris if isinstance(tris, list) else (tris.get("content", []) if isinstance(tris, dict) else [])
    if not tri_list:
        s, tri = req("POST", f"/convenios/{CONV_ID}/trimestres", "COORDINADOR",
                     body={"numero": 1, "materiaNucleo": "Práctica de Coformación I",
                           "fechaInicio": "2026-07-01", "fechaFin": "2026-09-30"})
        if s not in (200, 201): die(f"crear trimestre: {s} {tri}")
        TRI_ID = tri["id"]
        ok(f"trimestre creado (id={TRI_ID})")
    else:
        TRI_ID = tri_list[0]["id"]
        ok(f"trimestre auto-creado al firmar (id={TRI_ID}, {len(tri_list)} en total)")

    # --- 7. PLAN DE ACTIVIDADES ---
    s, _ = req("PUT", f"/trimestres/{TRI_ID}/plan-actividades", "ESTUDIANTE",
               body={"escenarioCoformacion": "Desarrollo de software en Coally",
                     "pemDescripcionEscenario": "El equipo backend necesita automatizar reportes.",
                     "pemObjetivoGeneral": "Implementar un módulo de reportería que reduzca el tiempo manual.",
                     "objetivos": [
                         {"escenario": "Backend", "descripcion": "Aplicar Spring Boot en un caso real", "seleccionado": True, "orden": 1},
                         {"escenario": "Datos", "descripcion": "Modelar y consultar PostgreSQL", "seleccionado": True, "orden": 2},
                     ],
                     "meses": [
                         {"mes": 1, "areaRotacion": "Backend", "actividades": "Onboarding + primeras APIs", "tutorNombre": "Juan Castro"},
                         {"mes": 2, "areaRotacion": "Backend", "actividades": "Módulo de reportería", "tutorNombre": "Juan Castro"},
                         {"mes": 3, "areaRotacion": "QA", "actividades": "Pruebas y despliegue", "tutorNombre": "Juan Castro"},
                     ]})
    if s == 200:
        ok("plan de actividades guardado")
        for parte in ["ESTUDIANTE", "TUTOR", "PROFESOR"]:
            req("PATCH", f"/trimestres/{TRI_ID}/plan-actividades/firmar/{parte}", "COORDINADOR")
        ok("plan de actividades firmado (3 partes)")
    else:
        warn(f"plan actividades: {s} {_}")

    # --- 8. ACTAS (3) ---
    actas = [
        (1, "INICIAL", "2026-07-05", "Reunión de inicio de práctica"),
        (2, "SEGUIMIENTO", "2026-08-15", "Seguimiento de mitad de periodo"),
        (3, "EVALUACION_FINAL", "2026-09-25", "Cierre y evaluación final"),
    ]
    for num, tipo, fecha, asunto in actas:
        s, acta = req("POST", f"/trimestres/{TRI_ID}/actas", "COORDINADOR",
                      body={"numero": num, "fecha": fecha, "hora": "10:00", "lugar": "Virtual",
                            "asunto": asunto, "tipoReunion": tipo,
                            "asistentes": [
                                {"nombre": "Kellyn Delgado", "rol": "Estudiante", "correo": "kelly@est.uempresarial.edu.co"},
                                {"nombre": "Juan Castro", "rol": "Tutor empresarial", "correo": "jcastro@coally.com"},
                                {"nombre": "Carlos Mendoza", "rol": "Profesor", "correo": "cmendoza@uempresarial.edu.co"},
                            ],
                            "observaciones": "Sin novedades relevantes.",
                            "temas": [{"tema": "Avance de actividades", "observaciones": "En tiempo", "orden": 1}]})
        if s in (200, 201):
            aid = acta["id"]
            for parte in ["ESTUDIANTE", "TUTOR", "PROFESOR"]:
                req("PATCH", f"/actas/{aid}/firmar/{parte}", "COORDINADOR")
        else:
            warn(f"acta {num}: {s} {acta}")
    ok("3 actas creadas y firmadas")

    # --- 9. EVALUACIÓN TUTOR (GAC-FM-007) ---
    s, _ = req("PUT", f"/trimestres/{TRI_ID}/evaluacion-tutor", "COORDINADOR",
               body={"capacidades": 4.5, "actitudes": 4.7, "aplicacionDesempeno": 4.6,
                     "aplicacionElaboracionPem": 4.5, "aplicacionSustentacionPem": 4.4,
                     "continuidadConEmpresa": True,
                     "observaciones": "Excelente desempeño; la empresa desea continuidad.",
                     "fechaElaboracion": "2026-09-28"})
    if s == 200:
        for parte in ["TUTOR", "ESTUDIANTE"]:
            req("PATCH", f"/trimestres/{TRI_ID}/evaluacion-tutor/firmar/{parte}", "COORDINADOR")
        ok("evaluación del tutor (GAC-FM-007) guardada y firmada · continuidad=SÍ")
    else:
        warn(f"eval tutor: {s} {_}")

    # --- 10. EVALUACIÓN PROFESOR (GAC-FM-1, 2 cortes) ---
    s, _ = req("PUT", f"/trimestres/{TRI_ID}/evaluacion-profesor", "COORDINADOR",
               body={"capacidades": 4.3, "actitudes": 4.5, "aplicacionDesempeno": 4.4,
                     "aplicacionElaboracionPem": 4.6, "aplicacionSustentacionPem": 4.2,
                     "observacionesC1": "Buen primer corte.", "fechaC1": "2026-08-20",
                     "capacidadesC2": 4.6, "actitudesC2": 4.7, "aplicacionDesempenoC2": 4.7,
                     "aplicacionElaboracionPemC2": 4.8, "aplicacionSustentacionPemC2": 4.5,
                     "observacionesC2": "Mejoró notablemente.", "fechaC2": "2026-09-26",
                     "observaciones": "Proceso sólido en ambos cortes.", "fechaElaboracion": "2026-09-28"})
    if s == 200:
        for parte in ["PROFESOR", "ESTUDIANTE"]:
            req("PATCH", f"/trimestres/{TRI_ID}/evaluacion-profesor/firmar/{parte}", "COORDINADOR")
        ok("evaluación del profesor (GAC-FM-1, 2 cortes) guardada y firmada")
    else:
        warn(f"eval profesor: {s} {_}")

    # --- 11. PLAN DE MEJORA ---
    s, pm = req("POST", f"/trimestres/{TRI_ID}/planes-mejora", "COORDINADOR",
                body={"numero": 1, "titulo": "Automatización de reportería en Coally",
                      "problema": "Los reportes se generan manualmente y consumen 6 horas semanales.",
                      "objetivo": "Reducir el tiempo de reportería en 80% mediante automatización.",
                      "actividades": "Diseño, desarrollo del módulo, pruebas y despliegue.",
                      "indicadores": "Tiempo de generación; cobertura de pruebas."})
    if s in (200, 201):
        PM_ID = pm["id"]
        ok(f"plan de mejora creado (id={PM_ID})")

        # --- 12. INFORME FINAL (GTC-FM-16) ---
        s, _ = req("PUT", f"/planes-mejora/{PM_ID}/informe-final", "ESTUDIANTE",
                   body={"tituloInforme": "Automatización del proceso de reportería en Coally S.A.S.",
                         "nivel": 3, "cargoTutorEmpresarial": "Tech Lead Backend",
                         "resumenEjecutivo": "Este informe presenta el desarrollo de un módulo de reportería automatizada que redujo el tiempo manual en un 80%, aplicando los conocimientos adquiridos durante la práctica de Coformación en Coally S.A.S.",
                         "contextualizacion": "Coally S.A.S. es una empresa de tecnología del sector de talento. El área backend gestionaba reportes de forma manual.",
                         "planteamientoProblema": "La generación manual de reportes consumía 6 horas semanales y era propensa a errores, afectando la toma de decisiones.",
                         "marcoTeorico": "Se fundamenta en arquitectura de microservicios, patrones de diseño y automatización de procesos con Spring Batch y consultas optimizadas.",
                         "objetivoGeneral": "Implementar un módulo de reportería automatizada que reduzca el tiempo de generación en al menos 80%.",
                         "objetivosEspecificos": "1) Diagnosticar el proceso actual. 2) Diseñar la solución. 3) Desarrollar el módulo. 4) Validar resultados.",
                         "diagnostico": "Mediante análisis DOFA se identificaron debilidades en el proceso manual y oportunidades de automatización.",
                         "metodologia": "Metodología ágil con iteraciones semanales, revisiones con el tutor y entregas incrementales.",
                         "propuestaSolucion": "Módulo backend en Spring Boot que consulta la base de datos y genera reportes programados en PDF.",
                         "factibilidad": "Técnicamente viable con el stack actual; económicamente ahorra ~24 horas/mes de trabajo manual.",
                         "conclusiones": "El módulo cumplió el objetivo: redujo el tiempo de reportería de 6 horas a menos de 1 hora semanal, validando los objetivos planteados.",
                         "anexos": "Diagramas de arquitectura, capturas y repositorio del código.",
                         "numeroPaginas": 14})
        if s == 200:
            ok("informe final (GTC-FM-16) guardado con las 12 secciones")
            # buscar el id del informe
            s2, inf = req("GET", f"/planes-mejora/{PM_ID}/informe-final", "COORDINADOR")
            INF_ID = inf["id"] if s2 == 200 else None
            if INF_ID:
                s, _ = req("POST", f"/informes-final-pm/{INF_ID}/entregar", "ESTUDIANTE")
                if s == 200: ok("informe ENTREGADO")
                else: warn(f"entregar informe: {s} {_}")
                s, _ = req("POST", f"/informes-final-pm/{INF_ID}/aprobar", "COORDINADOR")
                if s == 200: ok("informe APROBADO por Coformación")
                else: warn(f"aprobar informe: {s} {_}")
        else:
            warn(f"informe final: {s} {_}")
    else:
        warn(f"plan de mejora: {s} {pm}")

    # --- 13. CIERRE ---
    s, _ = req("PATCH", f"/convenios/{CONV_ID}/finalizar", "COORDINADOR",
               body={"calificacionFinal": 4.6})
    if s == 200: ok("convenio FINALIZADO con nota 4.6")
    else: warn(f"finalizar convenio: {s} {_}")

    print(f"\n{G}✓ Ciclo de vida completo sembrado.{RST}")
    print(f"  Convenio #{CONV_ID} · Trimestre #{TRI_ID} · Práctica de Kellyn Delgado de inicio a fin.")

if __name__ == "__main__":
    main()
