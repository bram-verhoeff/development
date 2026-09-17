/**
 * HHS BPMN Modeler - Core Application Logic
 * Powered by bpmn-js
 * Specially designed for De Haagse Hogeschool BPM Course
 */

// ===================================================================
// BPMN 2.0 Templates Library
// ===================================================================
const TEMPLATES = {
  // 1. Standaard Pool met 2 Swimlanes (Klant & Haagse Hogeschool)
  swimlane: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Swimlane"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_HHS" name="Haagse Hogeschool" processRef="Process_HHS" />
    <bpmn:participant id="Participant_Klant" name="Klant / Student" />
    <bpmn:messageFlow id="Flow_Msg_1" name="Aanvraag indienen" sourceRef="Participant_Klant" targetRef="StartEvent_1" />
  </bpmn:collaboration>

  <bpmn:process id="Process_HHS" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_FrontOffice" name="Front Office">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Activity_GegevensCheck</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Compleet</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_Afwijzen</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_BackOffice" name="Back Office">
        <bpmn:flowNodeRef>Activity_AanvraagVerwerken</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_Succes</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="StartEvent_1" name="Aanvraag ontvangen">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
      <bpmn:messageEventDefinition id="MessageEventDefinition_1" />
    </bpmn:startEvent>

    <bpmn:userTask id="Activity_GegevensCheck" name="Gegevens controleren">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="Gateway_Compleet" name="Gegevens compleet?" default="Flow_Nee">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_Ja</bpmn:outgoing>
      <bpmn:outgoing>Flow_Nee</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="Activity_AanvraagVerwerken" name="Aanvraag verwerken">
      <bpmn:incoming>Flow_Ja</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:endEvent id="EndEvent_Afwijzen" name="Aanvraag afgewezen">
      <bpmn:incoming>Flow_Nee</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:endEvent id="EndEvent_Succes" name="Aanvraag goedgekeurd">
      <bpmn:incoming>Flow_4</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="Flow_1" sourceRef="StartEvent_1" targetRef="Activity_GegevensCheck" />
    <bpmn:sequenceFlow id="Flow_2" sourceRef="Activity_GegevensCheck" targetRef="Gateway_Compleet" />
    <bpmn:sequenceFlow id="Flow_Ja" name="Ja" sourceRef="Gateway_Compleet" targetRef="Activity_AanvraagVerwerken" />
    <bpmn:sequenceFlow id="Flow_Nee" name="Nee" sourceRef="Gateway_Compleet" targetRef="EndEvent_Afwijzen" />
    <bpmn:sequenceFlow id="Flow_4" sourceRef="Activity_AanvraagVerwerken" targetRef="EndEvent_Succes" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="BPMNDiagram_1">
    <bpmndi:BPMNPlane id="BPMNPlane_1" bpmnElement="Collaboration_1">
      <bpmndi:BPMNShape id="Participant_Klant_di" bpmnElement="Participant_Klant" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="760" height="60" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Participant_HHS_di" bpmnElement="Participant_HHS" isHorizontal="true">
        <dc:Bounds x="160" y="180" width="760" height="280" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_FrontOffice_di" bpmnElement="Lane_FrontOffice" isHorizontal="true">
        <dc:Bounds x="190" y="180" width="730" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_BackOffice_di" bpmnElement="Lane_BackOffice" isHorizontal="true">
        <dc:Bounds x="190" y="320" width="730" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="StartEvent_1_di" bpmnElement="StartEvent_1">
        <dc:Bounds x="242" y="232" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="233" y="275" width="55" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_GegevensCheck_di" bpmnElement="Activity_GegevensCheck">
        <dc:Bounds x="330" y="210" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Compleet_di" bpmnElement="Gateway_Compleet" isMarkerVisible="true">
        <dc:Bounds x="505" y="225" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="502" y="195" width="57" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_Afwijzen_di" bpmnElement="EndEvent_Afwijzen">
        <dc:Bounds x="642" y="232" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="633" y="275" width="55" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Activity_AanvraagVerwerken_di" bpmnElement="Activity_AanvraagVerwerken">
        <dc:Bounds x="600" y="350" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="EndEvent_Succes_di" bpmnElement="EndEvent_Succes">
        <dc:Bounds x="782" y="372" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="768" y="415" width="65" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_1_di" bpmnElement="Flow_1">
        <di:waypoint x="278" y="250" />
        <di:waypoint x="330" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_2_di" bpmnElement="Flow_2">
        <di:waypoint x="450" y="250" />
        <di:waypoint x="505" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Nee_di" bpmnElement="Flow_Nee">
        <di:waypoint x="555" y="250" />
        <di:waypoint x="642" y="250" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="589" y="232" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Ja_di" bpmnElement="Flow_Ja">
        <di:waypoint x="530" y="275" />
        <di:waypoint x="530" y="390" />
        <di:waypoint x="600" y="390" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="539" y="323" width="13" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_4_di" bpmnElement="Flow_4">
        <di:waypoint x="720" y="390" />
        <di:waypoint x="782" y="390" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Msg_1_di" bpmnElement="Flow_Msg_1">
        <di:waypoint x="260" y="140" />
        <di:waypoint x="260" y="232" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="265" y="153" width="90" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  // 2. Order-to-Cash Proces (Klassiek bedrijfskundig proces voor BPM)
  'order-to-cash': `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_OrderToCash"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collab_OrderToCash">
    <bpmn:participant id="Part_Bedrijf" name="Handelsonderneming B.V." processRef="Process_OrderToCash" />
  </bpmn:collaboration>

  <bpmn:process id="Process_OrderToCash" isExecutable="false">
    <bpmn:laneSet id="LaneSet_OTC">
      <bpmn:lane id="Lane_Verkoop" name="Verkoop">
        <bpmn:flowNodeRef>Start_Order</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_KredietCheck</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Krediet</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Afgewezen</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Magazijn" name="Magazijn &amp; Logistiek">
        <bpmn:flowNodeRef>Fork_Parallel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Picken</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Verzenden</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Join_Parallel</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_Voltooid</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Financien" name="Financiële Administratie">
        <bpmn:flowNodeRef>Task_FactuurSturen</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_BetalingVerwerken</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Order" name="Klantorder ontvangen">
      <bpmn:outgoing>F1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:serviceTask id="Task_KredietCheck" name="Kredietwaardigheid controleren">
      <bpmn:incoming>F1</bpmn:incoming>
      <bpmn:outgoing>F2</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:exclusiveGateway id="Gateway_Krediet" name="Krediet akkoord?">
      <bpmn:incoming>F2</bpmn:incoming>
      <bpmn:outgoing>F_Akkoord</bpmn:outgoing>
      <bpmn:outgoing>F_NietAkkoord</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:endEvent id="End_Afgewezen" name="Order afwijzen">
      <bpmn:incoming>F_NietAkkoord</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:parallelGateway id="Fork_Parallel">
      <bpmn:incoming>F_Akkoord</bpmn:incoming>
      <bpmn:outgoing>F_Magazijn</bpmn:outgoing>
      <bpmn:outgoing>F_Factuur</bpmn:outgoing>
    </bpmn:parallelGateway>

    <bpmn:userTask id="Task_Picken" name="Artikelen verzamelen en verpakken">
      <bpmn:incoming>F_Magazijn</bpmn:incoming>
      <bpmn:outgoing>F_PickenKlaar</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_Verzenden" name="Pakket overdragen aan koerier">
      <bpmn:incoming>F_PickenKlaar</bpmn:incoming>
      <bpmn:outgoing>F_Verzonden</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:serviceTask id="Task_FactuurSturen" name="Factuur genereren en versturen">
      <bpmn:incoming>F_Factuur</bpmn:incoming>
      <bpmn:outgoing>F_FactuurVerstuurd</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:userTask id="Task_BetalingVerwerken" name="Ontvangen betaling afletteren">
      <bpmn:incoming>F_FactuurVerstuurd</bpmn:incoming>
      <bpmn:outgoing>F_Betaald</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:parallelGateway id="Join_Parallel">
      <bpmn:incoming>F_Verzonden</bpmn:incoming>
      <bpmn:incoming>F_Betaald</bpmn:incoming>
      <bpmn:outgoing>F_Einde</bpmn:outgoing>
    </bpmn:parallelGateway>

    <bpmn:endEvent id="End_Voltooid" name="Order succesvol afgerond">
      <bpmn:incoming>F_Einde</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="F1" sourceRef="Start_Order" targetRef="Task_KredietCheck" />
    <bpmn:sequenceFlow id="F2" sourceRef="Task_KredietCheck" targetRef="Gateway_Krediet" />
    <bpmn:sequenceFlow id="F_Akkoord" name="Ja" sourceRef="Gateway_Krediet" targetRef="Fork_Parallel" />
    <bpmn:sequenceFlow id="F_NietAkkoord" name="Nee" sourceRef="Gateway_Krediet" targetRef="End_Afgewezen" />
    <bpmn:sequenceFlow id="F_Magazijn" sourceRef="Fork_Parallel" targetRef="Task_Picken" />
    <bpmn:sequenceFlow id="F_Factuur" sourceRef="Fork_Parallel" targetRef="Task_FactuurSturen" />
    <bpmn:sequenceFlow id="F_PickenKlaar" sourceRef="Task_Picken" targetRef="Task_Verzenden" />
    <bpmn:sequenceFlow id="F_Verzonden" sourceRef="Task_Verzenden" targetRef="Join_Parallel" />
    <bpmn:sequenceFlow id="F_FactuurVerstuurd" sourceRef="Task_FactuurSturen" targetRef="Task_BetalingVerwerken" />
    <bpmn:sequenceFlow id="F_Betaald" sourceRef="Task_BetalingVerwerken" targetRef="Join_Parallel" />
    <bpmn:sequenceFlow id="F_Einde" sourceRef="Join_Parallel" targetRef="End_Voltooid" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="Diagram_OTC">
    <bpmndi:BPMNPlane id="Plane_OTC" bpmnElement="Collab_OrderToCash">
      <bpmndi:BPMNShape id="Part_Bedrijf_di" bpmnElement="Part_Bedrijf" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="1020" height="420" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Verkoop_di" bpmnElement="Lane_Verkoop" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="990" height="130" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Magazijn_di" bpmnElement="Lane_Magazijn" isHorizontal="true">
        <dc:Bounds x="190" y="210" width="990" height="150" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Financien_di" bpmnElement="Lane_Financien" isHorizontal="true">
        <dc:Bounds x="190" y="360" width="990" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Start_Order_di" bpmnElement="Start_Order">
        <dc:Bounds x="232" y="122" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="223" y="165" width="55" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_KredietCheck_di" bpmnElement="Task_KredietCheck">
        <dc:Bounds x="320" y="100" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Krediet_di" bpmnElement="Gateway_Krediet" isMarkerVisible="true">
        <dc:Bounds x="485" y="115" width="50" height="50" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="468" y="85" width="84" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Afgewezen_di" bpmnElement="End_Afgewezen">
        <dc:Bounds x="592" y="122" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="575" y="165" width="71" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Fork_Parallel_di" bpmnElement="Fork_Parallel">
        <dc:Bounds x="485" y="255" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Picken_di" bpmnElement="Task_Picken">
        <dc:Bounds x="580" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Verzenden_di" bpmnElement="Task_Verzenden">
        <dc:Bounds x="740" y="240" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_FactuurSturen_di" bpmnElement="Task_FactuurSturen">
        <dc:Bounds x="580" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_BetalingVerwerken_di" bpmnElement="Task_BetalingVerwerken">
        <dc:Bounds x="740" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Join_Parallel_di" bpmnElement="Join_Parallel">
        <dc:Bounds x="905" y="255" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Voltooid_di" bpmnElement="End_Voltooid">
        <dc:Bounds x="1012" y="262" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="990" y="305" width="81" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="F1_di" bpmnElement="F1">
        <di:waypoint x="268" y="140" />
        <di:waypoint x="320" y="140" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F2_di" bpmnElement="F2">
        <di:waypoint x="440" y="140" />
        <di:waypoint x="485" y="140" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_NietAkkoord_di" bpmnElement="F_NietAkkoord">
        <di:waypoint x="535" y="140" />
        <di:waypoint x="592" y="140" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="554" y="122" width="20" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Akkoord_di" bpmnElement="F_Akkoord">
        <di:waypoint x="510" y="165" />
        <di:waypoint x="510" y="255" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="519" y="193" width="13" height="14" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Magazijn_di" bpmnElement="F_Magazijn">
        <di:waypoint x="535" y="280" />
        <di:waypoint x="580" y="280" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Factuur_di" bpmnElement="F_Factuur">
        <di:waypoint x="510" y="305" />
        <di:waypoint x="510" y="430" />
        <di:waypoint x="580" y="430" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_PickenKlaar_di" bpmnElement="F_PickenKlaar">
        <di:waypoint x="700" y="280" />
        <di:waypoint x="740" y="280" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Verzonden_di" bpmnElement="F_Verzonden">
        <di:waypoint x="860" y="280" />
        <di:waypoint x="905" y="280" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_FactuurVerstuurd_di" bpmnElement="F_FactuurVerstuurd">
        <di:waypoint x="700" y="430" />
        <di:waypoint x="740" y="430" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Betaald_di" bpmnElement="F_Betaald">
        <di:waypoint x="860" y="430" />
        <di:waypoint x="930" y="430" />
        <di:waypoint x="930" y="305" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="F_Einde_di" bpmnElement="F_Einde">
        <di:waypoint x="955" y="280" />
        <di:waypoint x="1012" y="280" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  // 3. HHS Tentamenprocedure
  exam: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Exam"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collab_Exam">
    <bpmn:participant id="Part_HHS_Exam" name="De Haagse Hogeschool" processRef="Process_Exam" />
  </bpmn:collaboration>

  <bpmn:process id="Process_Exam" isExecutable="false">
    <bpmn:laneSet id="LaneSet_Exam">
      <bpmn:lane id="Lane_Student" name="Student">
        <bpmn:flowNodeRef>Start_Aanmelding</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Inschrijven</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Maken</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_CijferBekend</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Docent" name="Docent / Examinator">
        <bpmn:flowNodeRef>Task_Surveilleren</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Nakijken</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CijferInvoeren</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Examencommissie" name="Examenadministratie (Osiris)">
        <bpmn:flowNodeRef>Task_Publiceren</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Aanmelding" name="Inschrijfperiode geopend">
      <bpmn:outgoing>E_Flow1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:userTask id="Task_Inschrijven" name="Inschrijven voor tentamen">
      <bpmn:incoming>E_Flow1</bpmn:incoming>
      <bpmn:outgoing>E_Flow2</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_Maken" name="Tentamen afleggen">
      <bpmn:incoming>E_Flow2</bpmn:incoming>
      <bpmn:outgoing>E_Flow3</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_Surveilleren" name="Tentamen innemen en controleren">
      <bpmn:incoming>E_Flow3</bpmn:incoming>
      <bpmn:outgoing>E_Flow4</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_Nakijken" name="Werk beoordelen en normeren">
      <bpmn:incoming>E_Flow4</bpmn:incoming>
      <bpmn:outgoing>E_Flow5</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_CijferInvoeren" name="Cijfers invoeren in Osiris">
      <bpmn:incoming>E_Flow5</bpmn:incoming>
      <bpmn:outgoing>E_Flow6</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:serviceTask id="Task_Publiceren" name="Resultaten valideren en publiceren">
      <bpmn:incoming>E_Flow6</bpmn:incoming>
      <bpmn:outgoing>E_Flow7</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:endEvent id="End_CijferBekend" name="Cijfer zichtbaar voor student">
      <bpmn:incoming>E_Flow7</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:sequenceFlow id="E_Flow1" sourceRef="Start_Aanmelding" targetRef="Task_Inschrijven" />
    <bpmn:sequenceFlow id="E_Flow2" sourceRef="Task_Inschrijven" targetRef="Task_Maken" />
    <bpmn:sequenceFlow id="E_Flow3" sourceRef="Task_Maken" targetRef="Task_Surveilleren" />
    <bpmn:sequenceFlow id="E_Flow4" sourceRef="Task_Surveilleren" targetRef="Task_Nakijken" />
    <bpmn:sequenceFlow id="E_Flow5" sourceRef="Task_Nakijken" targetRef="Task_CijferInvoeren" />
    <bpmn:sequenceFlow id="E_Flow6" sourceRef="Task_CijferInvoeren" targetRef="Task_Publiceren" />
    <bpmn:sequenceFlow id="E_Flow7" sourceRef="Task_Publiceren" targetRef="End_CijferBekend" />
  </bpmn:process>

  <bpmndi:BPMNDiagram id="Diagram_Exam">
    <bpmndi:BPMNPlane id="Plane_Exam" bpmnElement="Collab_Exam">
      <bpmndi:BPMNShape id="Part_HHS_Exam_di" bpmnElement="Part_HHS_Exam" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="1060" height="420" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Student_di" bpmnElement="Lane_Student" isHorizontal="true">
        <dc:Bounds x="190" y="80" width="1030" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Docent_di" bpmnElement="Lane_Docent" isHorizontal="true">
        <dc:Bounds x="190" y="220" width="1030" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_Examencommissie_di" bpmnElement="Lane_Examencommissie" isHorizontal="true">
        <dc:Bounds x="190" y="360" width="1030" height="140" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Start_Aanmelding_di" bpmnElement="Start_Aanmelding">
        <dc:Bounds x="232" y="122" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="211" y="165" width="79" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Inschrijven_di" bpmnElement="Task_Inschrijven">
        <dc:Bounds x="320" y="100" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Maken_di" bpmnElement="Task_Maken">
        <dc:Bounds x="480" y="100" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Surveilleren_di" bpmnElement="Task_Surveilleren">
        <dc:Bounds x="480" y="250" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Nakijken_di" bpmnElement="Task_Nakijken">
        <dc:Bounds x="640" y="250" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_CijferInvoeren_di" bpmnElement="Task_CijferInvoeren">
        <dc:Bounds x="800" y="250" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Publiceren_di" bpmnElement="Task_Publiceren">
        <dc:Bounds x="800" y="390" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_CijferBekend_di" bpmnElement="End_CijferBekend">
        <dc:Bounds x="972" y="122" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="955" y="165" width="71" height="27" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="E_Flow1_di" bpmnElement="E_Flow1">
        <di:waypoint x="268" y="140" />
        <di:waypoint x="320" y="140" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_Flow2_di" bpmnElement="E_Flow2">
        <di:waypoint x="440" y="140" />
        <di:waypoint x="480" y="140" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_Flow3_di" bpmnElement="E_Flow3">
        <di:waypoint x="540" y="180" />
        <di:waypoint x="540" y="250" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_Flow4_di" bpmnElement="E_Flow4">
        <di:waypoint x="600" y="290" />
        <di:waypoint x="640" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_Flow5_di" bpmnElement="E_Flow5">
        <di:waypoint x="760" y="290" />
        <di:waypoint x="800" y="290" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_Flow6_di" bpmnElement="E_Flow6">
        <di:waypoint x="860" y="330" />
        <di:waypoint x="860" y="390" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="E_Flow7_di" bpmnElement="E_Flow7">
        <di:waypoint x="920" y="430" />
        <di:waypoint x="990" y="430" />
        <di:waypoint x="990" y="158" />
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  // 4. Klachtenafhandeling
  incident: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Incident"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Incident" isExecutable="false">
    <bpmn:startEvent id="Start_Klacht" name="Klacht gemeld">
      <bpmn:outgoing>I_F1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:userTask id="Task_Registreren" name="Klacht registreren en beoordelen">
      <bpmn:incoming>I_F1</bpmn:incoming>
      <bpmn:outgoing>I_F2</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="Gateway_Complex" name="Eerstelijns oplosbaar?">
      <bpmn:incoming>I_F2</bpmn:incoming>
      <bpmn:outgoing>I_Ja</bpmn:outgoing>
      <bpmn:outgoing>I_Nee</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:userTask id="Task_DirectOplossen" name="Directe oplossing bieden">
      <bpmn:incoming>I_Ja</bpmn:incoming>
      <bpmn:outgoing>I_F3</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:userTask id="Task_Escaleren" name="Escaleren naar tweedelijns specialist">
      <bpmn:incoming>I_Nee</bpmn:incoming>
      <bpmn:outgoing>I_F4</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:exclusiveGateway id="Gateway_Merge">
      <bpmn:incoming>I_F3</bpmn:incoming>
      <bpmn:incoming>I_F4</bpmn:incoming>
      <bpmn:outgoing>I_F5</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:userTask id="Task_Terugkoppelen" name="Klant informeren over afhandeling">
      <bpmn:incoming>I_F5</bpmn:incoming>
      <bpmn:outgoing>I_F6</bpmn:outgoing>
    </bpmn:userTask>
    <bpmn:endEvent id="End_Opgelost" name="Klacht afgesloten">
      <bpmn:incoming>I_F6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="I_F1" sourceRef="Start_Klacht" targetRef="Task_Registreren" />
    <bpmn:sequenceFlow id="I_F2" sourceRef="Task_Registreren" targetRef="Gateway_Complex" />
    <bpmn:sequenceFlow id="I_Ja" name="Ja" sourceRef="Gateway_Complex" targetRef="Task_DirectOplossen" />
    <bpmn:sequenceFlow id="I_Nee" name="Nee" sourceRef="Gateway_Complex" targetRef="Task_Escaleren" />
    <bpmn:sequenceFlow id="I_F3" sourceRef="Task_DirectOplossen" targetRef="Gateway_Merge" />
    <bpmn:sequenceFlow id="I_F4" sourceRef="Task_Escaleren" targetRef="Gateway_Merge" />
    <bpmn:sequenceFlow id="I_F5" sourceRef="Gateway_Merge" targetRef="Task_Terugkoppelen" />
    <bpmn:sequenceFlow id="I_F6" sourceRef="Task_Terugkoppelen" targetRef="End_Opgelost" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_Incident">
    <bpmndi:BPMNPlane id="Plane_Incident" bpmnElement="Process_Incident">
      <bpmndi:BPMNShape id="Start_Klacht_di" bpmnElement="Start_Klacht">
        <dc:Bounds x="182" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="165" y="205" width="71" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Registreren_di" bpmnElement="Task_Registreren">
        <dc:Bounds x="270" y="140" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Complex_di" bpmnElement="Gateway_Complex" isMarkerVisible="true">
        <dc:Bounds x="445" y="155" width="50" height="50" />
        <bpmndi:BPMNLabel><dc:Bounds x="440" y="125" width="60" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_DirectOplossen_di" bpmnElement="Task_DirectOplossen">
        <dc:Bounds x="550" y="140" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Escaleren_di" bpmnElement="Task_Escaleren">
        <dc:Bounds x="550" y="260" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Merge_di" bpmnElement="Gateway_Merge" isMarkerVisible="true">
        <dc:Bounds x="725" y="155" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Terugkoppelen_di" bpmnElement="Task_Terugkoppelen">
        <dc:Bounds x="830" y="140" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Opgelost_di" bpmnElement="End_Opgelost">
        <dc:Bounds x="1002" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="978" y="205" width="85" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="I_F1_di" bpmnElement="I_F1"><di:waypoint x="218" y="180" /><di:waypoint x="270" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="I_F2_di" bpmnElement="I_F2"><di:waypoint x="390" y="180" /><di:waypoint x="445" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="I_Ja_di" bpmnElement="I_Ja"><di:waypoint x="495" y="180" /><di:waypoint x="550" y="180" /><bpmndi:BPMNLabel><dc:Bounds x="516" y="162" width="13" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="I_Nee_di" bpmnElement="I_Nee"><di:waypoint x="470" y="205" /><di:waypoint x="470" y="300" /><di:waypoint x="550" y="300" /><bpmndi:BPMNLabel><dc:Bounds x="475" y="249" width="20" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="I_F3_di" bpmnElement="I_F3"><di:waypoint x="670" y="180" /><di:waypoint x="725" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="I_F4_di" bpmnElement="I_F4"><di:waypoint x="670" y="300" /><di:waypoint x="750" y="300" /><di:waypoint x="750" y="205" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="I_F5_di" bpmnElement="I_F5"><di:waypoint x="775" y="180" /><di:waypoint x="830" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="I_F6_di" bpmnElement="I_F6"><di:waypoint x="950" y="180" /><di:waypoint x="1002" y="180" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`
};

// ===================================================================
// Color Palettes for Highlighting Elements
// ===================================================================
const COLOR_PRESETS = {
  default: { stroke: '#334155', fill: '#ffffff' },
  success: { stroke: '#059669', fill: '#d1fae5' }, // Green (Happy path)
  warning: { stroke: '#d97706', fill: '#fef3c7' }, // Amber (Timer / Waiting)
  danger:  { stroke: '#dc2626', fill: '#fee2e2' }, // Red (Exceptions)
  info:    { stroke: '#2563eb', fill: '#dbeafe' }, // Blue (System / Data)
  purple:  { stroke: '#7c3aed', fill: '#ede9fe' }  // Purple (External)
};

// ===================================================================
// Application State & Modeler Instance
// ===================================================================
let bpmnModeler = null;
let autosaveTimeout = null;
const STORAGE_KEY_XML = 'hhs_bpmn_modeler_xml_v1';
const STORAGE_KEY_TITLE = 'hhs_bpmn_modeler_title_v1';

// DOM Elements
const canvasEl = document.getElementById('canvas');
const titleInput = document.getElementById('diagram-title');
const saveStatusEl = document.getElementById('save-status');
const saveStatusText = saveStatusEl.querySelector('.status-text');
const btnUndo = document.getElementById('btn-undo');
const btnRedo = document.getElementById('btn-redo');
const zoomLevelLabel = document.getElementById('zoom-level-label');
const selectionInfoEl = document.getElementById('selection-info');
const toastContainer = document.getElementById('toast-container');
const fileInput = document.getElementById('file-input');
const dropZoneOverlay = document.getElementById('drop-zone-overlay');

// Initialize Lucide Icons
function refreshIcons() {
  if (window.lucide) {
    window.lucide.createIcons();
  }
}

// Show Toast Notifications
function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span>${message}</span>`;
  toastContainer.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = '0';
    setTimeout(() => toast.remove(), 200);
  }, duration);
}

// Update Autosave Indicator
function setSaveStatus(state) {
  if (state === 'saving') {
    saveStatusEl.classList.add('saving');
    saveStatusText.textContent = 'Opslaan...';
  } else {
    saveStatusEl.classList.remove('saving');
    saveStatusText.textContent = 'Opgeslagen';
  }
}

// ===================================================================
// Modeler Initialization
// ===================================================================
async function initModeler() {
  try {
    bpmnModeler = new BpmnJS({
      container: canvasEl,
      keyboard: {
        bindTo: document
      }
    });

    // Event listeners on modeler
    const eventBus = bpmnModeler.get('eventBus');
    const commandStack = bpmnModeler.get('commandStack');
    const selection = bpmnModeler.get('selection');
    const canvas = bpmnModeler.get('canvas');

    // History and changes
    eventBus.on('commandStack.changed', () => {
      btnUndo.disabled = !commandStack.canUndo();
      btnRedo.disabled = !commandStack.canRedo();
      triggerAutosave();
    });

    // Selection changed
    eventBus.on('selection.changed', (e) => {
      const selected = e.newSelection;
      if (!selected || selected.length === 0) {
        selectionInfoEl.innerHTML = '<span class="selection-placeholder">Geen element geselecteerd (klik op een vorm)</span>';
      } else if (selected.length === 1) {
        const elem = selected[0];
        const name = elem.businessObject.name || 'Naamloos';
        const type = elem.type.replace('bpmn:', '');
        selectionInfoEl.innerHTML = `<span>Geselecteerd: <strong>${escapeHtml(name)}</strong></span> <span class="selection-badge">${type}</span>`;
      } else {
        selectionInfoEl.innerHTML = `<span><strong>${selected.length}</strong> elementen geselecteerd</span>`;
      }
    });

    // Canvas view zoom level tracking
    eventBus.on('canvas.viewbox.changed', () => {
      try {
        const zoom = Math.round(canvas.zoom() * 100);
        zoomLevelLabel.textContent = `${zoom}%`;
      } catch (e) {}
    });

    // Restore saved diagram or load default
    const savedTitle = localStorage.getItem(STORAGE_KEY_TITLE);
    if (savedTitle) {
      titleInput.value = savedTitle;
    }

    const savedXml = localStorage.getItem(STORAGE_KEY_XML);
    if (savedXml && savedXml.trim().length > 0) {
      await loadDiagram(savedXml, false);
      showToast('Opgeslagen model hersteld uit browsergeheugen', 'info');
    } else {
      await loadDiagram(TEMPLATES.swimlane, false);
    }

    refreshIcons();
  } catch (err) {
    console.error('Fout bij initialiseren van BPMN Modeler:', err);
    showToast('Kon BPMN Modeler niet laden: ' + err.message, 'error', 6000);
  }
}

// Helper to escape HTML characters
function escapeHtml(str) {
  return str.replace(/[&<>'"]/g, 
    tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
  );
}

// Load Diagram into Modeler
async function loadDiagram(xml, resetZoom = true) {
  try {
    await bpmnModeler.importXML(xml);
    const canvas = bpmnModeler.get('canvas');
    if (resetZoom) {
      canvas.zoom('fit-viewport');
    }
    setSaveStatus('saved');
    refreshIcons();
  } catch (err) {
    console.error('Fout bij importeren van XML:', err);
    showToast('Ongeldig BPMN bestand: ' + err.message, 'error', 5000);
  }
}

// Autosave with Debounce
function triggerAutosave() {
  setSaveStatus('saving');
  clearTimeout(autosaveTimeout);
  autosaveTimeout = setTimeout(async () => {
    try {
      const { xml } = await bpmnModeler.saveXML({ format: true });
      localStorage.setItem(STORAGE_KEY_XML, xml);
      localStorage.setItem(STORAGE_KEY_TITLE, titleInput.value.trim());
      setSaveStatus('saved');
    } catch (err) {
      console.warn('Autosave kon niet voltooien:', err);
    }
  }, 750);
}

// ===================================================================
// Export Functions (PNG, SVG, BPMN 2.0 XML)
// ===================================================================
function getSanitizedFilename(ext) {
  const name = titleInput.value.trim().replace(/[/\\?%*:|"<>]/g, '_') || 'bedrijfsproces';
  return `${name}.${ext}`;
}

function triggerDownload(content, filename, mimeType) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// Download BPMN 2.0 XML (.bpmn)
async function exportBPMN() {
  try {
    const { xml } = await bpmnModeler.saveXML({ format: true });
    triggerDownload(xml, getSanitizedFilename('bpmn'), 'application/xml');
    showToast('BPMN 2.0 XML gedownload (.bpmn)', 'success');
  } catch (err) {
    showToast('Fout bij exporteren van XML: ' + err.message, 'error');
  }
}

// Download SVG (.svg)
async function exportSVG() {
  try {
    const { svg } = await bpmnModeler.saveSVG();
    triggerDownload(svg, getSanitizedFilename('svg'), 'image/svg+xml;charset=utf-8');
    showToast('Vector SVG afbeelding gedownload', 'success');
  } catch (err) {
    showToast('Fout bij exporteren van SVG: ' + err.message, 'error');
  }
}

// Download High-Resolution PNG (.png) with crisp white background
async function exportPNG() {
  try {
    const { svg } = await bpmnModeler.saveSVG();
    
    // Parse SVG to extract dimensions
    const parser = new DOMParser();
    const svgDoc = parser.parseFromString(svg, 'image/svg+xml');
    const svgEl = svgDoc.documentElement;

    const viewBox = svgEl.getAttribute('viewBox');
    let width = 1200;
    let height = 800;

    if (viewBox) {
      const parts = viewBox.split(/\s+/).map(Number);
      if (parts.length === 4) {
        width = parts[2];
        height = parts[3];
      }
    }

    // Scale factor 2x for sharp rendering in Word reports
    const scale = 2;
    const canvas = document.createElement('canvas');
    canvas.width = (width + 60) * scale;
    canvas.height = (height + 60) * scale;
    const ctx = canvas.getContext('2d');

    // Fill white background (no transparent issues in Word)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const img = new Image();
    const svgBlob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      ctx.drawImage(img, 30 * scale, 30 * scale, width * scale, height * scale);
      URL.revokeObjectURL(url);

      canvas.toBlob((blob) => {
        if (!blob) {
          showToast('Kon PNG niet renderen', 'error');
          return;
        }
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = getSanitizedFilename('png');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(a.href);
        showToast('Haarscherpe PNG afbeelding gedownload voor verslag!', 'success');
      }, 'image/png');
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      showToast('Fout bij rasteren van SVG naar PNG', 'error');
    };

    img.src = url;
  } catch (err) {
    showToast('Fout bij exporteren van PNG: ' + err.message, 'error');
  }
}

// ===================================================================
// Event Listeners & Toolbar Setup
// ===================================================================
document.addEventListener('DOMContentLoaded', () => {
  initModeler();

  // Title changes
  titleInput.addEventListener('input', () => {
    triggerAutosave();
  });

  // Undo / Redo
  btnUndo.addEventListener('click', () => {
    if (bpmnModeler) bpmnModeler.get('commandStack').undo();
  });
  btnRedo.addEventListener('click', () => {
    if (bpmnModeler) bpmnModeler.get('commandStack').redo();
  });

  // Zoom controls
  document.getElementById('btn-zoom-in').addEventListener('click', () => {
    if (!bpmnModeler) return;
    const canvas = bpmnModeler.get('canvas');
    canvas.zoom(canvas.zoom() * 1.25);
  });

  document.getElementById('btn-zoom-out').addEventListener('click', () => {
    if (!bpmnModeler) return;
    const canvas = bpmnModeler.get('canvas');
    canvas.zoom(canvas.zoom() / 1.25);
  });

  document.getElementById('btn-zoom-fit').addEventListener('click', () => {
    if (!bpmnModeler) return;
    bpmnModeler.get('canvas').zoom('fit-viewport');
  });

  document.getElementById('btn-zoom-reset').addEventListener('click', () => {
    if (!bpmnModeler) return;
    bpmnModeler.get('canvas').zoom(1.0);
  });

  // Color Highlighter Dots
  document.querySelectorAll('.color-dot-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      if (!bpmnModeler) return;
      const colorKey = btn.dataset.color;
      const preset = COLOR_PRESETS[colorKey];
      if (!preset) return;

      const selection = bpmnModeler.get('selection').get();
      if (!selection || selection.length === 0) {
        showToast('Selecteer eerst een taak of gateway om een kleur toe te passen', 'info');
        return;
      }

      const modeling = bpmnModeler.get('modeling');
      modeling.setColor(selection, preset);
      showToast('Kleurmarkering toegepast', 'success');
    });
  });

  // Nieuw Diagram
  document.getElementById('btn-new').addEventListener('click', () => {
    if (confirm('Weet je zeker dat je een nieuw diagram wilt beginnen? Zorg dat je huidige werk is opgeslagen of geëxporteerd.')) {
      titleInput.value = 'Nieuw Bedrijfsproces';
      loadDiagram(TEMPLATES.swimlane, true);
      showToast('Nieuw blanco swimlane diagram aangemaakt', 'info');
    }
  });

  // Open File
  const btnOpenFile = document.getElementById('btn-open-file');
  btnOpenFile.addEventListener('click', () => fileInput.click());

  fileInput.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const xml = event.target.result;
      const cleanName = file.name.replace(/\.(bpmn|xml)$/i, '');
      titleInput.value = cleanName;
      loadDiagram(xml, true);
      showToast(`Bestand '${file.name}' geopend`, 'success');
      fileInput.value = '';
    };
    reader.readAsText(file);
  });

  // Templates Selection
  document.querySelectorAll('[data-template]').forEach(item => {
    item.addEventListener('click', () => {
      const templateKey = item.dataset.template;
      const xml = TEMPLATES[templateKey];
      if (!xml) return;

      const titleMap = {
        'swimlane': 'Basis Pool & Swimlanes',
        'order-to-cash': 'Order-to-Cash Proces',
        'exam': 'HHS Tentamenprocedure',
        'incident': 'Klachtenafhandeling'
      };

      titleInput.value = titleMap[templateKey] || 'Voorbeeld Proces';
      loadDiagram(xml, true);
      closeAllDropdowns();
      showToast(`Voorbeeld '${titleMap[templateKey]}' ingeladen`, 'success');
    });
  });

  // Export Buttons
  document.getElementById('btn-export-png').addEventListener('click', () => {
    closeAllDropdowns();
    exportPNG();
  });
  document.getElementById('btn-export-svg').addEventListener('click', () => {
    closeAllDropdowns();
    exportSVG();
  });
  document.getElementById('btn-export-bpmn').addEventListener('click', () => {
    closeAllDropdowns();
    exportBPMN();
  });

  // Dropdown Toggles
  setupDropdown('btn-templates-dropdown');
  setupDropdown('btn-export-dropdown');

  function setupDropdown(triggerId) {
    const trigger = document.getElementById(triggerId);
    if (!trigger) return;
    const wrapper = trigger.closest('.dropdown-wrapper');

    trigger.addEventListener('click', (e) => {
      e.stopPropagation();
      const isOpen = wrapper.classList.contains('open');
      closeAllDropdowns();
      if (!isOpen) {
        wrapper.classList.add('open');
      }
    });
  }

  function closeAllDropdowns() {
    document.querySelectorAll('.dropdown-wrapper.open').forEach(w => w.classList.remove('open'));
  }

  window.addEventListener('click', () => closeAllDropdowns());

  // Modals Setup (Cheatsheet & Shortcuts)
  const modalCheatsheet = document.getElementById('modal-cheatsheet');
  const modalShortcuts = document.getElementById('modal-shortcuts');

  document.getElementById('btn-cheatsheet').addEventListener('click', () => {
    modalCheatsheet.classList.add('open');
  });
  document.getElementById('btn-close-cheatsheet').addEventListener('click', () => {
    modalCheatsheet.classList.remove('open');
  });
  document.getElementById('btn-close-cheatsheet-bottom').addEventListener('click', () => {
    modalCheatsheet.classList.remove('open');
  });

  document.getElementById('btn-shortcuts').addEventListener('click', () => {
    modalShortcuts.classList.add('open');
  });
  document.getElementById('btn-close-shortcuts').addEventListener('click', () => {
    modalShortcuts.classList.remove('open');
  });

  // Close modals on click outside
  [modalCheatsheet, modalShortcuts].forEach(modal => {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.classList.remove('open');
      }
    });
  });

  // Keyboard Shortcuts
  window.addEventListener('keydown', (e) => {
    // Escape closes modals and dropdowns
    if (e.key === 'Escape') {
      modalCheatsheet.classList.remove('open');
      modalShortcuts.classList.remove('open');
      closeAllDropdowns();
    }

    // Ctrl + S triggers BPMN export
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      exportBPMN();
    }
  });

  // Drag and Drop files onto canvas
  window.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZoneOverlay.classList.add('active');
  });

  window.addEventListener('dragleave', (e) => {
    if (e.relatedTarget === null) {
      dropZoneOverlay.classList.remove('active');
    }
  });

  window.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZoneOverlay.classList.remove('active');

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.endsWith('.bpmn') || file.name.endsWith('.xml')) {
        const reader = new FileReader();
        reader.onload = (event) => {
          const xml = event.target.result;
          titleInput.value = file.name.replace(/\.(bpmn|xml)$/i, '');
          loadDiagram(xml, true);
          showToast(`Bestand '${file.name}' geopend via drag & drop`, 'success');
        };
        reader.readAsText(file);
      } else {
        showToast('Sleep een geldig .bpmn of .xml bestand hierheen', 'error');
      }
    }
  });
});
