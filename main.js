/**
 * Agevo BPMN Modeler - Core Application Logic
 * Powered by bpmn-js
 * Developed by AgevoDev (agevodev.nl) - Tech Studio & Venture Builder
 */

// ===================================================================
// BPMN 2.0 Templates Library
// ===================================================================
const TEMPLATES = {
  // 1. Standaard Pool met 2 Swimlanes (Klant & Agevo)
  swimlane: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Swimlane"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collaboration_1">
    <bpmn:participant id="Participant_Agevo" name="Agevo (agevodev.nl)" processRef="Process_Agevo" />
    <bpmn:participant id="Participant_Klant" name="Klant / Partner" />
    <bpmn:messageFlow id="Flow_Msg_1" name="Projectaanvraag indienen" sourceRef="Participant_Klant" targetRef="StartEvent_1" />
  </bpmn:collaboration>

  <bpmn:process id="Process_Agevo" isExecutable="false">
    <bpmn:laneSet id="LaneSet_1">
      <bpmn:lane id="Lane_FrontOffice" name="Client Success &amp; Product">
        <bpmn:flowNodeRef>StartEvent_1</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Activity_GegevensCheck</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Compleet</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_Afwijzen</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_BackOffice" name="Engineering &amp; Cloud">
        <bpmn:flowNodeRef>Activity_AanvraagVerwerken</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>EndEvent_Succes</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="StartEvent_1" name="Aanvraag ontvangen">
      <bpmn:outgoing>Flow_1</bpmn:outgoing>
      <bpmn:messageEventDefinition id="MessageEventDefinition_1" />
    </bpmn:startEvent>

    <bpmn:userTask id="Activity_GegevensCheck" name="Scope en vereisten valideren">
      <bpmn:incoming>Flow_1</bpmn:incoming>
      <bpmn:outgoing>Flow_2</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:exclusiveGateway id="Gateway_Compleet" name="Project haalbaar?" default="Flow_Nee">
      <bpmn:incoming>Flow_2</bpmn:incoming>
      <bpmn:outgoing>Flow_Ja</bpmn:outgoing>
      <bpmn:outgoing>Flow_Nee</bpmn:outgoing>
    </bpmn:exclusiveGateway>

    <bpmn:userTask id="Activity_AanvraagVerwerken" name="Venture sprint inplannen">
      <bpmn:incoming>Flow_Ja</bpmn:incoming>
      <bpmn:outgoing>Flow_4</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:endEvent id="EndEvent_Afwijzen" name="Aanvraag afgewezen">
      <bpmn:incoming>Flow_Nee</bpmn:incoming>
    </bpmn:endEvent>

    <bpmn:endEvent id="EndEvent_Succes" name="Project kick-off gestart">
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
      <bpmndi:BPMNShape id="Participant_Agevo_di" bpmnElement="Participant_Agevo" isHorizontal="true">
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

  // 3. SaaS Project & Delivery Flow
  exam: `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Exam"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collab_Exam">
    <bpmn:participant id="Part_Agevo_Exam" name="Agevo Studio (agevodev.nl)" processRef="Process_Exam" />
  </bpmn:collaboration>

  <bpmn:process id="Process_Exam" isExecutable="false">
    <bpmn:laneSet id="LaneSet_Exam">
      <bpmn:lane id="Lane_Student" name="Klant / Partner">
        <bpmn:flowNodeRef>Start_Aanmelding</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Inschrijven</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Maken</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_CijferBekend</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Docent" name="Engineering &amp; Product">
        <bpmn:flowNodeRef>Task_Surveilleren</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Nakijken</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_CijferInvoeren</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_Examencommissie" name="DevOps &amp; Cloud Infra">
        <bpmn:flowNodeRef>Task_Publiceren</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>

    <bpmn:startEvent id="Start_Aanmelding" name="Projectaanvraag ingediend">
      <bpmn:outgoing>E_Flow1</bpmn:outgoing>
    </bpmn:startEvent>

    <bpmn:userTask id="Task_Inschrijven" name="Scope &amp; vereisten afstemmen">
      <bpmn:incoming>E_Flow1</bpmn:incoming>
      <bpmn:outgoing>E_Flow2</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_Maken" name="Architectuur &amp; data modelleren">
      <bpmn:incoming>E_Flow2</bpmn:incoming>
      <bpmn:outgoing>E_Flow3</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_Surveilleren" name="Code review &amp; tests uitvoeren">
      <bpmn:incoming>E_Flow3</bpmn:incoming>
      <bpmn:outgoing>E_Flow4</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_Nakijken" name="Staging deployment &amp; QA">
      <bpmn:incoming>E_Flow4</bpmn:incoming>
      <bpmn:outgoing>E_Flow5</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:userTask id="Task_CijferInvoeren" name="Acceptatie &amp; security audit">
      <bpmn:incoming>E_Flow5</bpmn:incoming>
      <bpmn:outgoing>E_Flow6</bpmn:outgoing>
    </bpmn:userTask>

    <bpmn:serviceTask id="Task_Publiceren" name="Productie rollout &amp; CDN caching">
      <bpmn:incoming>E_Flow6</bpmn:incoming>
      <bpmn:outgoing>E_Flow7</bpmn:outgoing>
    </bpmn:serviceTask>

    <bpmn:endEvent id="End_CijferBekend" name="SaaS platform live &amp; operationeel">
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
      <bpmndi:BPMNShape id="Part_Agevo_Exam_di" bpmnElement="Part_Agevo_Exam" isHorizontal="true">
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
</bpmn:definitions>`,

  // 5. HHS Reader Figuur 3: Bevestigen van een plank (XOR Keuze & Merge)
  'reader-plank': `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Plank"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Plank" isExecutable="false">
    <bpmn:startEvent id="Start_Plank" name="Er zijn te weinig planken voor alle studieboeken">
      <bpmn:outgoing>Flow_P1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_PakPlank" name="Pak een plank">
      <bpmn:incoming>Flow_P1</bpmn:incoming>
      <bpmn:outgoing>Flow_P2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_ControlCheck" name="Bekijk of plank gespijkerd of geschroefd moet worden">
      <bpmn:incoming>Flow_P2</bpmn:incoming>
      <bpmn:outgoing>Flow_P3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_XOR_Split">
      <bpmn:incoming>Flow_P3</bpmn:incoming>
      <bpmn:outgoing>Flow_Spijkeren</bpmn:outgoing>
      <bpmn:outgoing>Flow_Schroeven</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_Spijkeren" name="Spijker de plank vast">
      <bpmn:incoming>Flow_Spijkeren</bpmn:incoming>
      <bpmn:outgoing>Flow_SpijkerenKlaar</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Schroeven" name="Schroef de plank vast">
      <bpmn:incoming>Flow_Schroeven</bpmn:incoming>
      <bpmn:outgoing>Flow_SchroevenKlaar</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_XOR_Merge">
      <bpmn:incoming>Flow_SpijkerenKlaar</bpmn:incoming>
      <bpmn:incoming>Flow_SchroevenKlaar</bpmn:incoming>
      <bpmn:outgoing>Flow_P4</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_PlaatsBoeken" name="Plaats de studieboeken op de plank">
      <bpmn:incoming>Flow_P4</bpmn:incoming>
      <bpmn:outgoing>Flow_P5</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="End_Plank" name="Studieboeken staan op de plank">
      <bpmn:incoming>Flow_P5</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_P1" sourceRef="Start_Plank" targetRef="Task_PakPlank" />
    <bpmn:sequenceFlow id="Flow_P2" sourceRef="Task_PakPlank" targetRef="Task_ControlCheck" />
    <bpmn:sequenceFlow id="Flow_P3" sourceRef="Task_ControlCheck" targetRef="Gateway_XOR_Split" />
    <bpmn:sequenceFlow id="Flow_Spijkeren" name="Spijkeren" sourceRef="Gateway_XOR_Split" targetRef="Task_Spijkeren" />
    <bpmn:sequenceFlow id="Flow_Schroeven" name="Schroeven" sourceRef="Gateway_XOR_Split" targetRef="Task_Schroeven" />
    <bpmn:sequenceFlow id="Flow_SpijkerenKlaar" sourceRef="Task_Spijkeren" targetRef="Gateway_XOR_Merge" />
    <bpmn:sequenceFlow id="Flow_SchroevenKlaar" sourceRef="Task_Schroeven" targetRef="Gateway_XOR_Merge" />
    <bpmn:sequenceFlow id="Flow_P4" sourceRef="Gateway_XOR_Merge" targetRef="Task_PlaatsBoeken" />
    <bpmn:sequenceFlow id="Flow_P5" sourceRef="Task_PlaatsBoeken" targetRef="End_Plank" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_Plank">
    <bpmndi:BPMNPlane id="Plane_Plank" bpmnElement="Process_Plank">
      <bpmndi:BPMNShape id="Start_Plank_di" bpmnElement="Start_Plank">
        <dc:Bounds x="162" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="135" y="205" width="90" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_PakPlank_di" bpmnElement="Task_PakPlank">
        <dc:Bounds x="250" y="140" width="110" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_ControlCheck_di" bpmnElement="Task_ControlCheck">
        <dc:Bounds x="390" y="140" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_XOR_Split_di" bpmnElement="Gateway_XOR_Split" isMarkerVisible="true">
        <dc:Bounds x="545" y="155" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Spijkeren_di" bpmnElement="Task_Spijkeren">
        <dc:Bounds x="630" y="70" width="110" height="70" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Schroeven_di" bpmnElement="Task_Schroeven">
        <dc:Bounds x="630" y="220" width="110" height="70" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_XOR_Merge_di" bpmnElement="Gateway_XOR_Merge" isMarkerVisible="true">
        <dc:Bounds x="775" y="155" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_PlaatsBoeken_di" bpmnElement="Task_PlaatsBoeken">
        <dc:Bounds x="860" y="140" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Plank_di" bpmnElement="End_Plank">
        <dc:Bounds x="1022" y="162" width="36" height="36" />
        <bpmndi:BPMNLabel>
          <dc:Bounds x="1000" y="205" width="80" height="40" />
        </bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_P1_di" bpmnElement="Flow_P1"><di:waypoint x="198" y="180" /><di:waypoint x="250" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_P2_di" bpmnElement="Flow_P2"><di:waypoint x="360" y="180" /><di:waypoint x="390" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_P3_di" bpmnElement="Flow_P3"><di:waypoint x="510" y="180" /><di:waypoint x="545" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Spijkeren_di" bpmnElement="Flow_Spijkeren">
        <di:waypoint x="570" y="155" /><di:waypoint x="570" y="105" /><di:waypoint x="630" y="105" />
        <bpmndi:BPMNLabel><dc:Bounds x="565" y="85" width="48" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Schroeven_di" bpmnElement="Flow_Schroeven">
        <di:waypoint x="570" y="205" /><di:waypoint x="570" y="255" /><di:waypoint x="630" y="255" />
        <bpmndi:BPMNLabel><dc:Bounds x="562" y="260" width="56" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_SpijkerenKlaar_di" bpmnElement="Flow_SpijkerenKlaar">
        <di:waypoint x="740" y="105" /><di:waypoint x="800" y="105" /><di:waypoint x="800" y="155" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_SchroevenKlaar_di" bpmnElement="Flow_SchroevenKlaar">
        <di:waypoint x="740" y="255" /><di:waypoint x="800" y="255" /><di:waypoint x="800" y="205" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_P4_di" bpmnElement="Flow_P4"><di:waypoint x="825" y="180" /><di:waypoint x="860" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_P5_di" bpmnElement="Flow_P5"><di:waypoint x="980" y="180" /><di:waypoint x="1022" y="180" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  // 6. HHS Reader Figuur 13 & 22: Diner Keuzemenu (Inclusive Gateway IOR & Default Flow \)
  'reader-diner': `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Diner"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Diner" isExecutable="false">
    <bpmn:startEvent id="Start_Diner" name="Klant wil dineren">
      <bpmn:outgoing>Flow_D1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_KeuzeMaken" name="Maak een keuze wat je gaat maken">
      <bpmn:incoming>Flow_D1</bpmn:incoming>
      <bpmn:outgoing>Flow_D2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:inclusiveGateway id="Gateway_IOR_Split" default="Flow_Restaurant">
      <bpmn:incoming>Flow_D2</bpmn:incoming>
      <bpmn:outgoing>Flow_Voor</bpmn:outgoing>
      <bpmn:outgoing>Flow_Bij</bpmn:outgoing>
      <bpmn:outgoing>Flow_Hoofd</bpmn:outgoing>
      <bpmn:outgoing>Flow_Restaurant</bpmn:outgoing>
    </bpmn:inclusiveGateway>
    <bpmn:task id="Task_Voorgerecht" name="Maak een voorgerecht">
      <bpmn:incoming>Flow_Voor</bpmn:incoming>
      <bpmn:outgoing>Flow_VoorKlaar</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Bijgerecht" name="Maak een bijgerecht">
      <bpmn:incoming>Flow_Bij</bpmn:incoming>
      <bpmn:outgoing>Flow_BijKlaar</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Hoofdgerecht" name="Maak een hoofdgerecht">
      <bpmn:incoming>Flow_Hoofd</bpmn:incoming>
      <bpmn:outgoing>Flow_HoofdKlaar</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Restaurant" name="Ga naar een restaurant">
      <bpmn:incoming>Flow_Restaurant</bpmn:incoming>
      <bpmn:outgoing>Flow_RestKlaar</bpmn:outgoing>
    </bpmn:task>
    <bpmn:inclusiveGateway id="Gateway_IOR_Merge">
      <bpmn:incoming>Flow_VoorKlaar</bpmn:incoming>
      <bpmn:incoming>Flow_BijKlaar</bpmn:incoming>
      <bpmn:incoming>Flow_HoofdKlaar</bpmn:incoming>
      <bpmn:incoming>Flow_RestKlaar</bpmn:incoming>
      <bpmn:outgoing>Flow_D3</bpmn:outgoing>
    </bpmn:inclusiveGateway>
    <bpmn:task id="Task_EetMaaltijd" name="Eet de maaltijd">
      <bpmn:incoming>Flow_D3</bpmn:incoming>
      <bpmn:outgoing>Flow_D4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="End_Diner" name="Maaltijd genuttigd">
      <bpmn:incoming>Flow_D4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_D1" sourceRef="Start_Diner" targetRef="Task_KeuzeMaken" />
    <bpmn:sequenceFlow id="Flow_D2" sourceRef="Task_KeuzeMaken" targetRef="Gateway_IOR_Split" />
    <bpmn:sequenceFlow id="Flow_Voor" name="Voorgerecht" sourceRef="Gateway_IOR_Split" targetRef="Task_Voorgerecht" />
    <bpmn:sequenceFlow id="Flow_Bij" name="Bijgerecht" sourceRef="Gateway_IOR_Split" targetRef="Task_Bijgerecht" />
    <bpmn:sequenceFlow id="Flow_Hoofd" name="Hoofdgerecht" sourceRef="Gateway_IOR_Split" targetRef="Task_Hoofdgerecht" />
    <bpmn:sequenceFlow id="Flow_Restaurant" name="Geen keuze gemaakt" sourceRef="Gateway_IOR_Split" targetRef="Task_Restaurant" />
    <bpmn:sequenceFlow id="Flow_VoorKlaar" sourceRef="Task_Voorgerecht" targetRef="Gateway_IOR_Merge" />
    <bpmn:sequenceFlow id="Flow_BijKlaar" sourceRef="Task_Bijgerecht" targetRef="Gateway_IOR_Merge" />
    <bpmn:sequenceFlow id="Flow_HoofdKlaar" sourceRef="Task_Hoofdgerecht" targetRef="Gateway_IOR_Merge" />
    <bpmn:sequenceFlow id="Flow_RestKlaar" sourceRef="Task_Restaurant" targetRef="Gateway_IOR_Merge" />
    <bpmn:sequenceFlow id="Flow_D3" sourceRef="Gateway_IOR_Merge" targetRef="Task_EetMaaltijd" />
    <bpmn:sequenceFlow id="Flow_D4" sourceRef="Task_EetMaaltijd" targetRef="End_Diner" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_Diner">
    <bpmndi:BPMNPlane id="Plane_Diner" bpmnElement="Process_Diner">
      <bpmndi:BPMNShape id="Start_Diner_di" bpmnElement="Start_Diner">
        <dc:Bounds x="162" y="212" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="141" y="255" width="81" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_KeuzeMaken_di" bpmnElement="Task_KeuzeMaken">
        <dc:Bounds x="240" y="190" width="120" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_IOR_Split_di" bpmnElement="Gateway_IOR_Split">
        <dc:Bounds x="405" y="205" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Voorgerecht_di" bpmnElement="Task_Voorgerecht">
        <dc:Bounds x="530" y="60" width="115" height="65" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Bijgerecht_di" bpmnElement="Task_Bijgerecht">
        <dc:Bounds x="530" y="145" width="115" height="65" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Hoofdgerecht_di" bpmnElement="Task_Hoofdgerecht">
        <dc:Bounds x="530" y="235" width="115" height="65" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Restaurant_di" bpmnElement="Task_Restaurant">
        <dc:Bounds x="530" y="325" width="115" height="65" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_IOR_Merge_di" bpmnElement="Gateway_IOR_Merge">
        <dc:Bounds x="705" y="205" width="50" height="50" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_EetMaaltijd_di" bpmnElement="Task_EetMaaltijd">
        <dc:Bounds x="795" y="190" width="110" height="80" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Diner_di" bpmnElement="End_Diner">
        <dc:Bounds x="942" y="212" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="918" y="255" width="87" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_D1_di" bpmnElement="Flow_D1"><di:waypoint x="198" y="230" /><di:waypoint x="240" y="230" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_D2_di" bpmnElement="Flow_D2"><di:waypoint x="360" y="230" /><di:waypoint x="405" y="230" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Voor_di" bpmnElement="Flow_Voor">
        <di:waypoint x="430" y="205" /><di:waypoint x="430" y="92" /><di:waypoint x="530" y="92" />
        <bpmndi:BPMNLabel><dc:Bounds x="440" y="75" width="60" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Bij_di" bpmnElement="Flow_Bij">
        <di:waypoint x="440" y="215" /><di:waypoint x="470" y="177" /><di:waypoint x="530" y="177" />
        <bpmndi:BPMNLabel><dc:Bounds x="455" y="160" width="51" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Hoofd_di" bpmnElement="Flow_Hoofd">
        <di:waypoint x="440" y="245" /><di:waypoint x="470" y="267" /><di:waypoint x="530" y="267" />
        <bpmndi:BPMNLabel><dc:Bounds x="445" y="270" width="67" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Restaurant_di" bpmnElement="Flow_Restaurant">
        <di:waypoint x="430" y="255" /><di:waypoint x="430" y="357" /><di:waypoint x="530" y="357" />
        <bpmndi:BPMNLabel><dc:Bounds x="436" y="335" width="64" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_VoorKlaar_di" bpmnElement="Flow_VoorKlaar">
        <di:waypoint x="645" y="92" /><di:waypoint x="730" y="92" /><di:waypoint x="730" y="205" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_BijKlaar_di" bpmnElement="Flow_BijKlaar">
        <di:waypoint x="645" y="177" /><di:waypoint x="715" y="177" /><di:waypoint x="725" y="210" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_HoofdKlaar_di" bpmnElement="Flow_HoofdKlaar">
        <di:waypoint x="645" y="267" /><di:waypoint x="715" y="267" /><di:waypoint x="725" y="245" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_RestKlaar_di" bpmnElement="Flow_RestKlaar">
        <di:waypoint x="645" y="357" /><di:waypoint x="730" y="357" /><di:waypoint x="730" y="255" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_D3_di" bpmnElement="Flow_D3"><di:waypoint x="755" y="230" /><di:waypoint x="795" y="230" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_D4_di" bpmnElement="Flow_D4"><di:waypoint x="905" y="230" /><di:waypoint x="942" y="230" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  // 7. HHS Reader Figuur 18: Parallel Proces (AND-split & AND-join)
  'reader-parallel': `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Parallel"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Parallel" isExecutable="false">
    <bpmn:startEvent id="Start_Par" name="Start opdracht">
      <bpmn:outgoing>Flow_Par1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_A" name="Taak A">
      <bpmn:incoming>Flow_Par1</bpmn:incoming>
      <bpmn:outgoing>Flow_Par2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:parallelGateway id="Gateway_AND_Split">
      <bpmn:incoming>Flow_Par2</bpmn:incoming>
      <bpmn:outgoing>Flow_To_B</bpmn:outgoing>
      <bpmn:outgoing>Flow_To_C</bpmn:outgoing>
      <bpmn:outgoing>Flow_To_D</bpmn:outgoing>
    </bpmn:parallelGateway>
    <bpmn:task id="Task_B" name="Taak B">
      <bpmn:incoming>Flow_To_B</bpmn:incoming>
      <bpmn:outgoing>Flow_From_B</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_C" name="Taak C">
      <bpmn:incoming>Flow_To_C</bpmn:incoming>
      <bpmn:outgoing>Flow_From_C</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_D" name="Taak D">
      <bpmn:incoming>Flow_To_D</bpmn:incoming>
      <bpmn:outgoing>Flow_From_D</bpmn:outgoing>
    </bpmn:task>
    <bpmn:parallelGateway id="Gateway_AND_Join">
      <bpmn:incoming>Flow_From_B</bpmn:incoming>
      <bpmn:incoming>Flow_From_C</bpmn:incoming>
      <bpmn:incoming>Flow_From_D</bpmn:incoming>
      <bpmn:outgoing>Flow_Par3</bpmn:outgoing>
    </bpmn:parallelGateway>
    <bpmn:task id="Task_E" name="Taak E">
      <bpmn:incoming>Flow_Par3</bpmn:incoming>
      <bpmn:outgoing>Flow_Par4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="End_Par" name="Opdracht voltooid">
      <bpmn:incoming>Flow_Par4</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_Par1" sourceRef="Start_Par" targetRef="Task_A" />
    <bpmn:sequenceFlow id="Flow_Par2" sourceRef="Task_A" targetRef="Gateway_AND_Split" />
    <bpmn:sequenceFlow id="Flow_To_B" sourceRef="Gateway_AND_Split" targetRef="Task_B" />
    <bpmn:sequenceFlow id="Flow_To_C" sourceRef="Gateway_AND_Split" targetRef="Task_C" />
    <bpmn:sequenceFlow id="Flow_To_D" sourceRef="Gateway_AND_Split" targetRef="Task_D" />
    <bpmn:sequenceFlow id="Flow_From_B" sourceRef="Task_B" targetRef="Gateway_AND_Join" />
    <bpmn:sequenceFlow id="Flow_From_C" sourceRef="Task_C" targetRef="Gateway_AND_Join" />
    <bpmn:sequenceFlow id="Flow_From_D" sourceRef="Task_D" targetRef="Gateway_AND_Join" />
    <bpmn:sequenceFlow id="Flow_Par3" sourceRef="Gateway_AND_Join" targetRef="Task_E" />
    <bpmn:sequenceFlow id="Flow_Par4" sourceRef="Task_E" targetRef="End_Par" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_Parallel">
    <bpmndi:BPMNPlane id="Plane_Parallel" bpmnElement="Process_Parallel">
      <bpmndi:BPMNShape id="Start_Par_di" bpmnElement="Start_Par">
        <dc:Bounds x="162" y="192" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="145" y="235" width="70" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_A_di" bpmnElement="Task_A"><dc:Bounds x="240" y="170" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_AND_Split_di" bpmnElement="Gateway_AND_Split"><dc:Bounds x="385" y="185" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_B_di" bpmnElement="Task_B"><dc:Bounds x="480" y="70" width="100" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_C_di" bpmnElement="Task_C"><dc:Bounds x="480" y="175" width="100" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_D_di" bpmnElement="Task_D"><dc:Bounds x="480" y="280" width="100" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_AND_Join_di" bpmnElement="Gateway_AND_Join"><dc:Bounds x="635" y="185" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_E_di" bpmnElement="Task_E"><dc:Bounds x="730" y="170" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Par_di" bpmnElement="End_Par">
        <dc:Bounds x="872" y="192" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="847" y="235" width="87" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Par1_di" bpmnElement="Flow_Par1"><di:waypoint x="198" y="210" /><di:waypoint x="240" y="210" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Par2_di" bpmnElement="Flow_Par2"><di:waypoint x="340" y="210" /><di:waypoint x="385" y="210" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_To_B_di" bpmnElement="Flow_To_B"><di:waypoint x="410" y="185" /><di:waypoint x="410" y="105" /><di:waypoint x="480" y="105" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_To_C_di" bpmnElement="Flow_To_C"><di:waypoint x="435" y="210" /><di:waypoint x="480" y="210" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_To_D_di" bpmnElement="Flow_To_D"><di:waypoint x="410" y="235" /><di:waypoint x="410" y="315" /><di:waypoint x="480" y="315" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_From_B_di" bpmnElement="Flow_From_B"><di:waypoint x="580" y="105" /><di:waypoint x="660" y="105" /><di:waypoint x="660" y="185" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_From_C_di" bpmnElement="Flow_From_C"><di:waypoint x="580" y="210" /><di:waypoint x="635" y="210" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_From_D_di" bpmnElement="Flow_From_D"><di:waypoint x="580" y="315" /><di:waypoint x="660" y="315" /><di:waypoint x="660" y="235" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Par3_di" bpmnElement="Flow_Par3"><di:waypoint x="685" y="210" /><di:waypoint x="730" y="210" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Par4_di" bpmnElement="Flow_Par4"><di:waypoint x="830" y="210" /><di:waypoint x="872" y="210" /></bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  // 8. HHS Reader Figuur 25 & 27: Dataflow, Data Objects & Data Store
  'reader-data': `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Data"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:process id="Process_Data" isExecutable="false">
    <bpmn:startEvent id="Start_Brief" name="Briefproces start">
      <bpmn:outgoing>Flow_B1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_StelOp" name="Stel brief op">
      <bpmn:incoming>Flow_B1</bpmn:incoming>
      <bpmn:outgoing>Flow_B2</bpmn:outgoing>
      <bpmn:dataOutputAssociation id="DOA_1">
        <bpmn:targetRef>DataObject_Draft</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:task>
    <bpmn:dataObjectReference id="DataObject_Draft" name="Brief [draft]" dataObjectRef="DO_Draft" />
    <bpmn:dataObject id="DO_Draft" />
    <bpmn:task id="Task_Verbeter" name="Verbeter brief">
      <bpmn:incoming>Flow_B2</bpmn:incoming>
      <bpmn:outgoing>Flow_B3</bpmn:outgoing>
      <bpmn:property id="Prop_V1" name="__targetRef_placeholder" />
      <bpmn:dataInputAssociation id="DIA_1">
        <bpmn:sourceRef>DataObject_Draft</bpmn:sourceRef>
        <bpmn:targetRef>Prop_V1</bpmn:targetRef>
      </bpmn:dataInputAssociation>
      <bpmn:dataOutputAssociation id="DOA_2">
        <bpmn:targetRef>DataObject_Verbeterd</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:task>
    <bpmn:dataObjectReference id="DataObject_Verbeterd" name="Brief [verbeterd]" dataObjectRef="DO_Verbeterd" />
    <bpmn:dataObject id="DO_Verbeterd" />
    <bpmn:task id="Task_Onderteken" name="Onderteken brief">
      <bpmn:incoming>Flow_B3</bpmn:incoming>
      <bpmn:outgoing>Flow_B4</bpmn:outgoing>
      <bpmn:property id="Prop_O1" name="__targetRef_placeholder" />
      <bpmn:dataInputAssociation id="DIA_2">
        <bpmn:sourceRef>DataObject_Verbeterd</bpmn:sourceRef>
        <bpmn:targetRef>Prop_O1</bpmn:targetRef>
      </bpmn:dataInputAssociation>
      <bpmn:dataOutputAssociation id="DOA_3">
        <bpmn:targetRef>DataObject_Ondertekend</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:task>
    <bpmn:dataObjectReference id="DataObject_Ondertekend" name="Brief [ondertekend]" dataObjectRef="DO_Ondertekend" />
    <bpmn:dataObject id="DO_Ondertekend" />
    <bpmn:task id="Task_Kopieer" name="Kopieer brief">
      <bpmn:incoming>Flow_B4</bpmn:incoming>
      <bpmn:outgoing>Flow_B5</bpmn:outgoing>
      <bpmn:property id="Prop_K1" name="__targetRef_placeholder" />
      <bpmn:dataInputAssociation id="DIA_3">
        <bpmn:sourceRef>DataObject_Ondertekend</bpmn:sourceRef>
        <bpmn:targetRef>Prop_K1</bpmn:targetRef>
      </bpmn:dataInputAssociation>
      <bpmn:dataOutputAssociation id="DOA_4">
        <bpmn:targetRef>DataObject_Kopie</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:task>
    <bpmn:dataObjectReference id="DataObject_Kopie" name="Brief [kopie]" dataObjectRef="DO_Kopie" />
    <bpmn:dataObject id="DO_Kopie" />
    <bpmn:parallelGateway id="Gateway_DataSplit">
      <bpmn:incoming>Flow_B5</bpmn:incoming>
      <bpmn:outgoing>Flow_Verstuur</bpmn:outgoing>
      <bpmn:outgoing>Flow_Archiveer</bpmn:outgoing>
    </bpmn:parallelGateway>
    <bpmn:task id="Task_Verstuur" name="Verstuur brief">
      <bpmn:incoming>Flow_Verstuur</bpmn:incoming>
      <bpmn:outgoing>Flow_B6</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Archiveer" name="Archiveer brief">
      <bpmn:incoming>Flow_Archiveer</bpmn:incoming>
      <bpmn:outgoing>Flow_B7</bpmn:outgoing>
      <bpmn:dataOutputAssociation id="DOA_Store">
        <bpmn:targetRef>DataStore_Map</bpmn:targetRef>
      </bpmn:dataOutputAssociation>
    </bpmn:task>
    <bpmn:dataStoreReference id="DataStore_Map" name="Brievenmap" />
    <bpmn:endEvent id="End_Verstuurd" name="Brief is verstuurd">
      <bpmn:incoming>Flow_B6</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:endEvent id="End_Gearchiveerd" name="Brief is gearchiveerd">
      <bpmn:incoming>Flow_B7</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_B1" sourceRef="Start_Brief" targetRef="Task_StelOp" />
    <bpmn:sequenceFlow id="Flow_B2" sourceRef="Task_StelOp" targetRef="Task_Verbeter" />
    <bpmn:sequenceFlow id="Flow_B3" sourceRef="Task_Verbeter" targetRef="Task_Onderteken" />
    <bpmn:sequenceFlow id="Flow_B4" sourceRef="Task_Onderteken" targetRef="Task_Kopieer" />
    <bpmn:sequenceFlow id="Flow_B5" sourceRef="Task_Kopieer" targetRef="Gateway_DataSplit" />
    <bpmn:sequenceFlow id="Flow_Verstuur" sourceRef="Gateway_DataSplit" targetRef="Task_Verstuur" />
    <bpmn:sequenceFlow id="Flow_Archiveer" sourceRef="Gateway_DataSplit" targetRef="Task_Archiveer" />
    <bpmn:sequenceFlow id="Flow_B6" sourceRef="Task_Verstuur" targetRef="End_Verstuurd" />
    <bpmn:sequenceFlow id="Flow_B7" sourceRef="Task_Archiveer" targetRef="End_Gearchiveerd" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_Data">
    <bpmndi:BPMNPlane id="Plane_Data" bpmnElement="Process_Data">
      <bpmndi:BPMNShape id="Start_Brief_di" bpmnElement="Start_Brief"><dc:Bounds x="152" y="162" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="131" y="205" width="81" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_StelOp_di" bpmnElement="Task_StelOp"><dc:Bounds x="220" y="140" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="DataObject_Draft_di" bpmnElement="DataObject_Draft"><dc:Bounds x="252" y="260" width="36" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="242" y="315" width="58" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Verbeter_di" bpmnElement="Task_Verbeter"><dc:Bounds x="350" y="140" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="DataObject_Verbeterd_di" bpmnElement="DataObject_Verbeterd"><dc:Bounds x="382" y="260" width="36" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="361" y="315" width="79" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Onderteken_di" bpmnElement="Task_Onderteken"><dc:Bounds x="480" y="140" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="DataObject_Ondertekend_di" bpmnElement="DataObject_Ondertekend"><dc:Bounds x="512" y="260" width="36" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="495" y="315" width="71" height="27" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Kopieer_di" bpmnElement="Task_Kopieer"><dc:Bounds x="610" y="140" width="100" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="DataObject_Kopie_di" bpmnElement="DataObject_Kopie"><dc:Bounds x="642" y="260" width="36" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="630" y="315" width="60" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_DataSplit_di" bpmnElement="Gateway_DataSplit"><dc:Bounds x="745" y="155" width="50" height="50" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Verstuur_di" bpmnElement="Task_Verstuur"><dc:Bounds x="830" y="90" width="100" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Archiveer_di" bpmnElement="Task_Archiveer"><dc:Bounds x="830" y="210" width="100" height="70" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="DataStore_Map_di" bpmnElement="DataStore_Map"><dc:Bounds x="975" y="275" width="50" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="971" y="332" width="60" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Verstuurd_di" bpmnElement="End_Verstuurd"><dc:Bounds x="972" y="107" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="948" y="150" width="85" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_Gearchiveerd_di" bpmnElement="End_Gearchiveerd"><dc:Bounds x="972" y="227" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="942" y="195" width="98" height="27" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_B1_di" bpmnElement="Flow_B1"><di:waypoint x="188" y="180" /><di:waypoint x="220" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_B2_di" bpmnElement="Flow_B2"><di:waypoint x="320" y="180" /><di:waypoint x="350" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_B3_di" bpmnElement="Flow_B3"><di:waypoint x="450" y="180" /><di:waypoint x="480" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_B4_di" bpmnElement="Flow_B4"><di:waypoint x="580" y="180" /><di:waypoint x="610" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_B5_di" bpmnElement="Flow_B5"><di:waypoint x="710" y="180" /><di:waypoint x="745" y="180" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Verstuur_di" bpmnElement="Flow_Verstuur"><di:waypoint x="770" y="155" /><di:waypoint x="770" y="125" /><di:waypoint x="830" y="125" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Archiveer_di" bpmnElement="Flow_Archiveer"><di:waypoint x="770" y="205" /><di:waypoint x="770" y="245" /><di:waypoint x="830" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_B6_di" bpmnElement="Flow_B6"><di:waypoint x="930" y="125" /><di:waypoint x="972" y="125" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_B7_di" bpmnElement="Flow_B7"><di:waypoint x="930" y="245" /><di:waypoint x="972" y="245" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="DOA_1_di" bpmnElement="DOA_1"><di:waypoint x="270" y="220" /><di:waypoint x="270" y="260" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="DIA_1_di" bpmnElement="DIA_1"><di:waypoint x="288" y="285" /><di:waypoint x="370" y="285" /><di:waypoint x="370" y="220" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="DOA_2_di" bpmnElement="DOA_2"><di:waypoint x="400" y="220" /><di:waypoint x="400" y="260" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="DIA_2_di" bpmnElement="DIA_2"><di:waypoint x="418" y="285" /><di:waypoint x="500" y="285" /><di:waypoint x="500" y="220" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="DOA_3_di" bpmnElement="DOA_3"><di:waypoint x="530" y="220" /><di:waypoint x="530" y="260" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="DIA_3_di" bpmnElement="DIA_3"><di:waypoint x="548" y="285" /><di:waypoint x="630" y="285" /><di:waypoint x="630" y="220" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="DOA_4_di" bpmnElement="DOA_4"><di:waypoint x="660" y="220" /><di:waypoint x="660" y="260" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="DOA_Store_di" bpmnElement="DOA_Store">
        <di:waypoint x="910" y="280" /><di:waypoint x="910" y="300" /><di:waypoint x="975" y="300" />
        <bpmndi:BPMNLabel><dc:Bounds x="895" y="305" width="80" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
    </bpmndi:BPMNPlane>
  </bpmndi:BPMNDiagram>
</bpmn:definitions>`,

  // 9. HHS Reader Figuur 31: Twee Pools & Message Flows (Klant Black Box & White Box)
  'reader-pools': `<?xml version="1.0" encoding="UTF-8"?>
<bpmn:definitions xmlns:bpmn="http://www.omg.org/spec/BPMN/20100524/MODEL"
                  xmlns:bpmndi="http://www.omg.org/spec/BPMN/20100524/DI"
                  xmlns:dc="http://www.omg.org/spec/DD/20100524/DC"
                  xmlns:di="http://www.omg.org/spec/DD/20100524/DI"
                  id="Definitions_Pools"
                  targetNamespace="http://bpmn.io/schema/bpmn">
  <bpmn:collaboration id="Collab_Pools">
    <bpmn:participant id="Participant_Klant_BB" name="Klant (Black Box)" />
    <bpmn:participant id="Participant_Organisatie" name="Bedrijfsorganisatie" processRef="Process_Organisatie" />
    <bpmn:messageFlow id="MsgFlow_1" name="Orderaanvraag" sourceRef="Participant_Klant_BB" targetRef="Start_Order" />
    <bpmn:messageFlow id="MsgFlow_2" name="Orderbevestiging &amp; Factuur" sourceRef="Task_Factureren" targetRef="Participant_Klant_BB" />
  </bpmn:collaboration>
  <bpmn:process id="Process_Organisatie" isExecutable="false">
    <bpmn:laneSet id="LaneSet_Org">
      <bpmn:lane id="Lane_FunctieY" name="Functie Y (Verkoop)">
        <bpmn:flowNodeRef>Start_Order</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Beoordelen</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Gateway_Order</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>Task_Factureren</bpmn:flowNodeRef>
        <bpmn:flowNodeRef>End_OrderKlaar</bpmn:flowNodeRef>
      </bpmn:lane>
      <bpmn:lane id="Lane_FunctieX" name="Functie X (Uitvoering)">
        <bpmn:flowNodeRef>Task_Uitvoeren</bpmn:flowNodeRef>
      </bpmn:lane>
    </bpmn:laneSet>
    <bpmn:startEvent id="Start_Order" name="Aanvraag ontvangen">
      <bpmn:outgoing>Flow_Org1</bpmn:outgoing>
    </bpmn:startEvent>
    <bpmn:task id="Task_Beoordelen" name="Beoordeel order">
      <bpmn:incoming>Flow_Org1</bpmn:incoming>
      <bpmn:outgoing>Flow_Org2</bpmn:outgoing>
    </bpmn:task>
    <bpmn:exclusiveGateway id="Gateway_Order" name="Akkoord?">
      <bpmn:incoming>Flow_Org2</bpmn:incoming>
      <bpmn:outgoing>Flow_Akkoord</bpmn:outgoing>
      <bpmn:outgoing>Flow_Afgekeurd</bpmn:outgoing>
    </bpmn:exclusiveGateway>
    <bpmn:task id="Task_Uitvoeren" name="Voer werkzaamheden uit">
      <bpmn:incoming>Flow_Akkoord</bpmn:incoming>
      <bpmn:outgoing>Flow_Org3</bpmn:outgoing>
    </bpmn:task>
    <bpmn:task id="Task_Factureren" name="Factureer klant">
      <bpmn:incoming>Flow_Org3</bpmn:incoming>
      <bpmn:outgoing>Flow_Org4</bpmn:outgoing>
    </bpmn:task>
    <bpmn:endEvent id="End_OrderKlaar" name="Order afgehandeld">
      <bpmn:incoming>Flow_Org4</bpmn:incoming>
      <bpmn:incoming>Flow_Afgekeurd</bpmn:incoming>
    </bpmn:endEvent>
    <bpmn:sequenceFlow id="Flow_Org1" sourceRef="Start_Order" targetRef="Task_Beoordelen" />
    <bpmn:sequenceFlow id="Flow_Org2" sourceRef="Task_Beoordelen" targetRef="Gateway_Order" />
    <bpmn:sequenceFlow id="Flow_Akkoord" name="Ja" sourceRef="Gateway_Order" targetRef="Task_Uitvoeren" />
    <bpmn:sequenceFlow id="Flow_Afgekeurd" name="Nee" sourceRef="Gateway_Order" targetRef="End_OrderKlaar" />
    <bpmn:sequenceFlow id="Flow_Org3" sourceRef="Task_Uitvoeren" targetRef="Task_Factureren" />
    <bpmn:sequenceFlow id="Flow_Org4" sourceRef="Task_Factureren" targetRef="End_OrderKlaar" />
  </bpmn:process>
  <bpmndi:BPMNDiagram id="Diagram_Pools">
    <bpmndi:BPMNPlane id="Plane_Pools" bpmnElement="Collab_Pools">
      <bpmndi:BPMNShape id="Participant_Klant_BB_di" bpmnElement="Participant_Klant_BB" isHorizontal="true">
        <dc:Bounds x="160" y="80" width="780" height="70" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Participant_Organisatie_di" bpmnElement="Participant_Organisatie" isHorizontal="true">
        <dc:Bounds x="160" y="210" width="780" height="270" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_FunctieY_di" bpmnElement="Lane_FunctieY" isHorizontal="true">
        <dc:Bounds x="190" y="210" width="750" height="135" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Lane_FunctieX_di" bpmnElement="Lane_FunctieX" isHorizontal="true">
        <dc:Bounds x="190" y="345" width="750" height="135" />
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Start_Order_di" bpmnElement="Start_Order">
        <dc:Bounds x="232" y="252" width="36" height="36" />
        <bpmndi:BPMNLabel><dc:Bounds x="223" y="295" width="55" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Beoordelen_di" bpmnElement="Task_Beoordelen"><dc:Bounds x="310" y="230" width="110" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Gateway_Order_di" bpmnElement="Gateway_Order" isMarkerVisible="true"><dc:Bounds x="465" y="245" width="50" height="50" /><bpmndi:BPMNLabel><dc:Bounds x="467" y="221" width="47" height="14" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Uitvoeren_di" bpmnElement="Task_Uitvoeren"><dc:Bounds x="560" y="375" width="120" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="Task_Factureren_di" bpmnElement="Task_Factureren"><dc:Bounds x="710" y="230" width="110" height="80" /></bpmndi:BPMNShape>
      <bpmndi:BPMNShape id="End_OrderKlaar_di" bpmnElement="End_OrderKlaar"><dc:Bounds x="862" y="252" width="36" height="36" /><bpmndi:BPMNLabel><dc:Bounds x="848" y="295" width="65" height="27" /></bpmndi:BPMNLabel></bpmndi:BPMNShape>
      <bpmndi:BPMNEdge id="Flow_Org1_di" bpmnElement="Flow_Org1"><di:waypoint x="268" y="270" /><di:waypoint x="310" y="270" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Org2_di" bpmnElement="Flow_Org2"><di:waypoint x="420" y="270" /><di:waypoint x="465" y="270" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Akkoord_di" bpmnElement="Flow_Akkoord">
        <di:waypoint x="490" y="295" /><di:waypoint x="490" y="415" /><di:waypoint x="560" y="415" />
        <bpmndi:BPMNLabel><dc:Bounds x="503" y="343" width="13" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Afgekeurd_di" bpmnElement="Flow_Afgekeurd">
        <di:waypoint x="515" y="270" /><di:waypoint x="710" y="270" />
        <bpmndi:BPMNLabel><dc:Bounds x="520" y="252" width="20" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Org3_di" bpmnElement="Flow_Org3">
        <di:waypoint x="680" y="415" /><di:waypoint x="765" y="415" /><di:waypoint x="765" y="310" />
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="Flow_Org4_di" bpmnElement="Flow_Org4"><di:waypoint x="820" y="270" /><di:waypoint x="862" y="270" /></bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MsgFlow_1_di" bpmnElement="MsgFlow_1">
        <di:waypoint x="250" y="150" /><di:waypoint x="250" y="252" />
        <bpmndi:BPMNLabel><dc:Bounds x="255" y="173" width="76" height="14" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
      <bpmndi:BPMNEdge id="MsgFlow_2_di" bpmnElement="MsgFlow_2">
        <di:waypoint x="765" y="230" /><di:waypoint x="765" y="150" />
        <bpmndi:BPMNLabel><dc:Bounds x="770" y="173" width="85" height="27" /></bpmndi:BPMNLabel>
      </bpmndi:BPMNEdge>
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
const STORAGE_KEY_XML = 'agevo_bpmn_modeler_xml_v1';
const STORAGE_KEY_TITLE = 'agevo_bpmn_modeler_title_v1';

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
      validateHHSRules(false);
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
      updateSelectionQuickActions();
    });

    // Canvas view zoom level tracking
    eventBus.on('canvas.viewbox.changed', () => {
      try {
        const zoom = Math.round(canvas.zoom() * 100);
        zoomLevelLabel.textContent = `${zoom}%`;
      } catch (e) {}
    });

    // Setup HHS BPMN tools sidebar
    setupSidebarTools();

    // Restore saved diagram or load default
    const savedTitle = localStorage.getItem(STORAGE_KEY_TITLE) || localStorage.getItem('hhs_bpmn_modeler_title_v1');
    if (savedTitle) {
      titleInput.value = savedTitle;
    }

    const savedXml = localStorage.getItem(STORAGE_KEY_XML) || localStorage.getItem('hhs_bpmn_modeler_xml_v1');
    if (savedXml && savedXml.trim().length > 0) {
      await loadDiagram(savedXml, false);
      showToast('Opgeslagen model hersteld uit browsergeheugen', 'info');
    } else {
      await loadDiagram(TEMPLATES.swimlane, false);
    }

    refreshIcons();
    validateHHSRules(false);
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
    validateHHSRules(false);
    updateSelectionQuickActions();
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
// HHS BPMN Modeler Helpers & Reader Tools (Paul de Vries)
// ===================================================================

function getElementPool(element, elementRegistry) {
  if (!element) return null;
  let current = element;
  while (current) {
    if (current.type === 'bpmn:Participant') {
      return current;
    }
    current = current.parent;
  }
  return null;
}

// 1. Toggle Default Flow (\ Schuin streepje) for Exception Issue (Hfdst 3.3)
function toggleDefaultFlow(targetFlow = null) {
  if (!bpmnModeler) return;
  const selection = bpmnModeler.get('selection').get();
  const flow = targetFlow || selection.find(el => el.type === 'bpmn:SequenceFlow');
  if (!flow) {
    showToast('Selecteer eerst een sequence flow (volgordepijl)', 'info');
    return;
  }
  const source = flow.source;
  if (!source || (source.type !== 'bpmn:ExclusiveGateway' && source.type !== 'bpmn:InclusiveGateway')) {
    showToast('Een default flow (uitzonderingsroute met \\) kan alleen starten vanaf een Exclusive (XOR) of Inclusive (IOR) gateway', 'warning', 4500);
    return;
  }
  const modeling = bpmnModeler.get('modeling');
  const isCurrentDefault = source.businessObject.default === flow.businessObject;
  if (isCurrentDefault) {
    modeling.updateProperties(source, { default: null });
    showToast('Default flow markering (\\) verwijderd', 'info');
  } else {
    modeling.updateProperties(source, { default: flow.businessObject });
    showToast('Standaardstroom (exception issue) gemarkeerd met schuin streepje (\\)', 'success');
  }
  updateSelectionQuickActions();
  validateHHSRules(false);
}
window.toggleDefaultFlow = toggleDefaultFlow;

// 2. Add Netto Data annotation to an association (Hfdst 4)
function promptNettoData() {
  if (!bpmnModeler) return;
  const selection = bpmnModeler.get('selection').get();
  const targetEl = selection.find(el => 
    el.type === 'bpmn:Association' || 
    el.type === 'bpmn:DataInputAssociation' || 
    el.type === 'bpmn:DataOutputAssociation' ||
    el.type === 'bpmn:DataStoreReference' ||
    el.type === 'bpmn:SequenceFlow'
  );
  if (!targetEl) {
    showToast('Selecteer eerst een (data-)associatie of data store om netto data in te stellen', 'info');
    return;
  }
  const currentName = targetEl.businessObject.name || '';
  const nettoText = prompt('Voer de netto data vermelding in (bijv. "Dagomzet", "Klantgegevens", "Inschrijving"):', currentName);
  if (nettoText !== null) {
    const modeling = bpmnModeler.get('modeling');
    modeling.updateProperties(targetEl, { name: nettoText.trim() });
    showToast(`Netto data annotatie bijgewerkt: "${nettoText.trim()}"`, 'success');
    validateHHSRules(false);
  }
}
window.promptNettoData = promptNettoData;

// 3. Add or update Data Object Status [status] (Hfdst 4)
function promptDataStatus() {
  if (!bpmnModeler) return;
  const selection = bpmnModeler.get('selection').get();
  const dataObj = selection.find(el => el.type === 'bpmn:DataObjectReference');
  if (!dataObj) {
    showToast('Selecteer eerst een Data Object (ezelsor) om een toestand toe te voegen', 'info');
    return;
  }
  let currentName = dataObj.businessObject.name || 'Data Object';
  let baseName = currentName.replace(/\s*\[.*?\]\s*$/, '').trim();
  const match = currentName.match(/\[(.*?)\]/);
  const existingStatus = match ? match[1] : 'draft';
  
  const status = prompt(`Voer de toestand in voor "${baseName}" (bijv. draft, verbeterd, ondertekend, gearchiveerd):`, existingStatus);
  if (status !== null) {
    const modeling = bpmnModeler.get('modeling');
    const newFullName = status.trim().length > 0 ? `${baseName} [${status.trim()}]` : baseName;
    modeling.updateProperties(dataObj, { name: newFullName });
    showToast(`Data toestand bijgewerkt naar: ${newFullName}`, 'success');
  }
}
window.promptDataStatus = promptDataStatus;

// 4. Add Swimlane to active pool
function addSwimlane() {
  if (!bpmnModeler) return;
  const modeling = bpmnModeler.get('modeling');
  const elementRegistry = bpmnModeler.get('elementRegistry');
  const selection = bpmnModeler.get('selection').get();
  
  let target = selection.find(el => el.type === 'bpmn:Participant' || el.type === 'bpmn:Lane');
  if (!target) {
    target = elementRegistry.filter(el => el.type === 'bpmn:Participant' || el.type === 'bpmn:Lane')[0];
  }
  if (target) {
    modeling.addLane(target, 'bottom');
    showToast('Nieuwe swimlane toegevoegd aan pool', 'success');
    validateHHSRules(false);
  } else {
    showToast('Plaats eerst een Pool om een swimlane aan toe te voegen', 'info');
  }
}
window.addSwimlane = addSwimlane;

// 5. Switch Gateway type (XOR, AND, IOR)
function switchGatewayTypeSelected(targetType) {
  if (!bpmnModeler) return;
  const selection = bpmnModeler.get('selection').get();
  const gateway = selection.find(el => 
    el.type === 'bpmn:ExclusiveGateway' || 
    el.type === 'bpmn:ParallelGateway' || 
    el.type === 'bpmn:InclusiveGateway'
  );
  if (!gateway) {
    showToast('Selecteer eerst een gateway om het type te wijzigen', 'info');
    return;
  }
  if (gateway.type === targetType) return;
  const bpmnReplace = bpmnModeler.get('bpmnReplace');
  const newElement = bpmnReplace.replaceElement(gateway, { type: targetType });
  bpmnModeler.get('selection').set([newElement]);
  updateSelectionQuickActions();
  showToast(`Gateway gewijzigd naar ${targetType.replace('bpmn:', '')}`, 'success');
}
window.switchGatewayTypeSelected = switchGatewayTypeSelected;

// 6. Highlight and center element on canvas
function highlightElement(elementId) {
  if (!bpmnModeler || !elementId) return;
  const elementRegistry = bpmnModeler.get('elementRegistry');
  const selection = bpmnModeler.get('selection');
  const canvas = bpmnModeler.get('canvas');
  const elem = elementRegistry.get(elementId);
  if (elem) {
    const modal = document.getElementById('modal-rules-checker');
    if (modal) modal.classList.remove('open');
    selection.set([elem]);
    try {
      canvas.scrollToElement(elem);
    } catch (e) {}
    showToast(`Element '${elem.businessObject.name || elem.id}' geselecteerd`, 'info');
  }
}
window.highlightElement = highlightElement;

// 7. Contextual Quick Actions on Selection
function updateSelectionQuickActions() {
  const container = document.getElementById('selection-quick-actions');
  if (!container || !bpmnModeler) return;

  const selection = bpmnModeler.get('selection').get();
  if (!selection || selection.length !== 1) {
    container.innerHTML = '';
    return;
  }

  const elem = selection[0];
  const type = elem.type;
  let html = '';

  // Sequence Flow
  if (type === 'bpmn:SequenceFlow') {
    const source = elem.source;
    const isFromGateway = source && (source.type === 'bpmn:ExclusiveGateway' || source.type === 'bpmn:InclusiveGateway');
    if (isFromGateway) {
      const isDefault = source.businessObject.default === elem.businessObject;
      html += `
        <button class="quick-action-btn ${isDefault ? 'active' : ''}" onclick="toggleDefaultFlow()" title="Zet deze uitgaande flow om naar de standaard uitzonderingsroute met een schuin streepje (\\)">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M5 12h14m-5-5l5 5-5 5"/><path d="M7 8l4 8" stroke-width="3"/></svg>
          <span>${isDefault ? 'Default Flow (\\) Actief' : 'Maak Default Flow (\\)'}</span>
        </button>
      `;
    }
  }

  // Data Object
  if (type === 'bpmn:DataObjectReference') {
    html += `
      <button class="quick-action-btn" onclick="promptDataStatus()" title="Voeg toestand toe aan data object (bijv. [draft], [verbeterd], [ondertekend])">
        <i data-lucide="tag"></i>
        <span>Toestand [status]</span>
      </button>
    `;
  }

  // Data Store
  if (type === 'bpmn:DataStoreReference') {
    html += `
      <button class="quick-action-btn" onclick="promptNettoData()" title="Netto data / annotatie bewerken">
        <i data-lucide="database"></i>
        <span>Netto Data / Naam</span>
      </button>
    `;
  }

  // Association or Data Associations
  if (type === 'bpmn:Association' || type === 'bpmn:DataInputAssociation' || type === 'bpmn:DataOutputAssociation') {
    html += `
      <button class="quick-action-btn" onclick="promptNettoData()" title="Benoem netto data (bijv. Dagomzet, Klanten, Inschrijving)">
        <i data-lucide="tag"></i>
        <span>Netto Data Annotatie</span>
      </button>
    `;
  }

  // Gateways: Quick type switcher between XOR, AND, IOR
  if (type === 'bpmn:ExclusiveGateway' || type === 'bpmn:ParallelGateway' || type === 'bpmn:InclusiveGateway') {
    html += `
      <button class="quick-action-btn ${type === 'bpmn:ExclusiveGateway' ? 'active' : ''}" onclick="switchGatewayTypeSelected('bpmn:ExclusiveGateway')" title="Wissel naar Exclusive Gateway (XOR - X)">
        <span>XOR (X)</span>
      </button>
      <button class="quick-action-btn ${type === 'bpmn:ParallelGateway' ? 'active' : ''}" onclick="switchGatewayTypeSelected('bpmn:ParallelGateway')" title="Wissel naar Parallel Gateway (AND - +)">
        <span>AND (+)</span>
      </button>
      <button class="quick-action-btn ${type === 'bpmn:InclusiveGateway' ? 'active' : ''}" onclick="switchGatewayTypeSelected('bpmn:InclusiveGateway')" title="Wissel naar Inclusive Gateway (IOR - O)">
        <span>IOR (O)</span>
      </button>
    `;
  }

  // Participant (Pool)
  if (type === 'bpmn:Participant') {
    html += `
      <button class="quick-action-btn" onclick="addSwimlane()" title="Voeg een extra swimlane (organisatorische functie) toe aan deze pool">
        <i data-lucide="plus"></i>
        <span>+ Swimlane</span>
      </button>
    `;
  }

  container.innerHTML = html;
  refreshIcons();
}

// 8. HHS Modelleringsregels Controleur (Paul de Vries Reader)
function validateHHSRules(openModal = false) {
  if (!bpmnModeler) return;
  const elementRegistry = bpmnModeler.get('elementRegistry');
  const allElements = elementRegistry.getAll();
  
  let errorsCount = 0;
  let warningsCount = 0;
  
  const rulesReport = [
    {
      id: 'rule-seq-flow-pools',
      title: 'Geen sequence flows tussen verschillende pools',
      ref: 'Hoofdstuk 5, Figuur 36 (Blz. 19-20)',
      desc: 'Een sequence flow mag NOOIT de grens van een pool overschrijden. Tussen twee verschillende pools zijn uitsluitend message flows toegestaan.',
      status: 'passed',
      violations: []
    },
    {
      id: 'rule-msg-flow-pools',
      title: 'Message flows uitsluitend tussen afzonderlijke pools',
      ref: 'Hoofdstuk 5, Figuur 31 (Blz. 17-18)',
      desc: 'Een message flow (gestreepte lijn) mag nooit binnen dezelfde pool of tussen taken binnen één organisatie gebruikt worden.',
      status: 'passed',
      violations: []
    },
    {
      id: 'rule-data-direct-store',
      title: 'Geen data object rechtstreeks aan data store gekoppeld',
      ref: 'Hoofdstuk 4, Figuur 26 (Blz. 16-17)',
      desc: 'Data objecten kunnen niet direct geassocieerd worden met een data store. Data-uitwisseling met een data store moet altijd via een taak (task) verlopen.',
      status: 'passed',
      violations: []
    },
    {
      id: 'rule-data-across-pools',
      title: 'Geen data-associaties die poolgrens overschrijden',
      ref: 'Hoofdstuk 5, Figuur 34 (Blz. 18-19)',
      desc: 'Communicatie tussen pools via data objecten of data stores is niet toegestaan. Communicatie tussen pools moet altijd met message flows verlopen.',
      status: 'passed',
      violations: []
    },
    {
      id: 'rule-start-events',
      title: 'Start Event richtlijnen (Hoofdstuk 2.1)',
      ref: 'Hoofdstuk 2.1 (Blz. 5-6)',
      desc: 'Een start event heeft als symbool een enkelvoudige dunne cirkel, mag geen inkomende sequence flows hebben en moet een betekenisvolle naam hebben (nooit "Het proces start").',
      status: 'passed',
      violations: []
    },
    {
      id: 'rule-end-events',
      title: 'End Event richtlijnen (Hoofdstuk 2.1)',
      ref: 'Hoofdstuk 2.1 (Blz. 5-6)',
      desc: 'Een end event heeft als symbool een dikke cirkel, mag geen uitgaande sequence flows hebben en wordt beschreven in de voltooide tijd (nooit "Het proces stopt").',
      status: 'passed',
      violations: []
    },
    {
      id: 'rule-gateways',
      title: 'Gateway splitsingen, condities & default flow',
      ref: 'Hoofdstuk 2.2 & 3 (Blz. 7-14)',
      desc: 'XOR en IOR splitsingen vereisen minimaal 2 uitgaande flows met benoemde condities of een uitzonderingsroute / default flow (\\\\).',
      status: 'passed',
      violations: []
    },
    {
      id: 'rule-task-naming',
      title: 'Taaknaamgeving (Hoofdstuk 2.1)',
      ref: 'Hoofdstuk 2.1 (Blz. 5-6)',
      desc: 'De naam van een taak bevat minstens één zelfstandig naamwoord plus een werkwoordsvorm (bij voorkeur infinitief of imperatief).',
      status: 'passed',
      violations: []
    }
  ];

  // Element arrays
  const seqFlows = allElements.filter(el => el.type === 'bpmn:SequenceFlow');
  const msgFlows = allElements.filter(el => el.type === 'bpmn:MessageFlow');
  const associations = allElements.filter(el => 
    el.type === 'bpmn:Association' || 
    el.type === 'bpmn:DataInputAssociation' || 
    el.type === 'bpmn:DataOutputAssociation'
  );
  const startEvents = allElements.filter(el => el.type === 'bpmn:StartEvent');
  const endEvents = allElements.filter(el => el.type === 'bpmn:EndEvent');
  const gateways = allElements.filter(el => 
    el.type === 'bpmn:ExclusiveGateway' || 
    el.type === 'bpmn:InclusiveGateway' || 
    el.type === 'bpmn:ParallelGateway'
  );
  const tasks = allElements.filter(el => 
    el.type === 'bpmn:Task' || 
    el.type === 'bpmn:UserTask' || 
    el.type === 'bpmn:ServiceTask' || 
    el.type === 'bpmn:ManualTask' || 
    el.type === 'bpmn:BusinessRuleTask' ||
    el.type === 'bpmn:ScriptTask'
  );

  // Check 1: Sequence flows between different pools
  seqFlows.forEach(flow => {
    if (flow.source && flow.target) {
      const sourcePool = getElementPool(flow.source, elementRegistry);
      const targetPool = getElementPool(flow.target, elementRegistry);
      if (sourcePool && targetPool && sourcePool.id !== targetPool.id) {
        rulesReport[0].violations.push({
          elementId: flow.id,
          label: `Sequence flow '${flow.businessObject.name || flow.id}' overschrijdt poolgrens van '${sourcePool.businessObject.name || sourcePool.id}' naar '${targetPool.businessObject.name || targetPool.id}'`
        });
      }
    }
  });

  // Check 2: Message flows inside same pool
  msgFlows.forEach(flow => {
    if (flow.source && flow.target) {
      const sourcePool = getElementPool(flow.source, elementRegistry);
      const targetPool = getElementPool(flow.target, elementRegistry);
      if (sourcePool && targetPool && sourcePool.id === targetPool.id) {
        rulesReport[1].violations.push({
          elementId: flow.id,
          label: `Message flow '${flow.businessObject.name || flow.id}' bevindt zich binnen dezelfde pool '${sourcePool.businessObject.name || sourcePool.id}'. Gebruik een sequence flow!`
        });
      }
    }
  });

  // Check 3: Data Object directly to Data Store
  associations.forEach(assoc => {
    if (assoc.source && assoc.target) {
      const isSrcObj = assoc.source.type === 'bpmn:DataObjectReference';
      const isDstObj = assoc.target.type === 'bpmn:DataObjectReference';
      const isSrcStore = assoc.source.type === 'bpmn:DataStoreReference';
      const isDstStore = assoc.target.type === 'bpmn:DataStoreReference';
      if ((isSrcObj && isDstStore) || (isSrcStore && isDstObj)) {
        rulesReport[2].violations.push({
          elementId: assoc.id,
          label: `Data object '${assoc.source.businessObject.name || assoc.source.id}' is direct gekoppeld aan data store '${assoc.target.businessObject.name || assoc.target.id}' (moet altijd via een taak!)`
        });
      }
    }
  });

  // Check 4: Data associations across pools
  associations.forEach(assoc => {
    if (assoc.source && assoc.target) {
      const sourcePool = getElementPool(assoc.source, elementRegistry);
      const targetPool = getElementPool(assoc.target, elementRegistry);
      if (sourcePool && targetPool && sourcePool.id !== targetPool.id) {
        rulesReport[3].violations.push({
          elementId: assoc.id,
          label: `Data-associatie verbindt elementen uit verschillende pools (${sourcePool.businessObject.name || 'Pool 1'} en ${targetPool.businessObject.name || 'Pool 2'}). Gebruik een message flow!`
        });
      }
    }
  });

  // Check 5: Start events
  if (startEvents.length === 0 && tasks.length > 0) {
    rulesReport[4].violations.push({
      elementId: null,
      label: 'Geen Start Event gevonden in het proces. Elk proces moet beginnen met minimaal 1 Start Event.'
    });
  }
  startEvents.forEach(start => {
    if (start.incoming && start.incoming.length > 0) {
      rulesReport[4].violations.push({
        elementId: start.id,
        label: `Start Event '${start.businessObject.name || start.id}' heeft ${start.incoming.length} inkomende sequence flow(s). Een Start Event mag NOOIT inkomende flows hebben!`
      });
    }
    const name = (start.businessObject.name || '').trim().toLowerCase();
    if (!name || name === 'start' || name === 'het proces start' || name === 'start event') {
      rulesReport[4].violations.push({
        elementId: start.id,
        isWarning: true,
        label: `Start Event '${start.businessObject.name || 'Naamloos'}' heeft een generieke of ontbrekende naam. Benoem de specifieke gebeurtenis die het proces triggert (bijv. 'Aanvraag ontvangen').`
      });
    }
  });

  // Check 6: End events
  if (endEvents.length === 0 && tasks.length > 0) {
    rulesReport[5].violations.push({
      elementId: null,
      label: 'Geen End Event gevonden in het proces. Elk proces moet eindigen in minimaal 1 End Event.'
    });
  }
  endEvents.forEach(end => {
    if (end.outgoing && end.outgoing.length > 0) {
      rulesReport[5].violations.push({
        elementId: end.id,
        label: `End Event '${end.businessObject.name || end.id}' heeft ${end.outgoing.length} uitgaande sequence flow(s). Een End Event mag NOOIT uitgaande flows hebben!`
      });
    }
    const name = (end.businessObject.name || '').trim().toLowerCase();
    if (!name || name === 'einde' || name === 'stop' || name === 'het proces stopt' || name === 'end event') {
      rulesReport[5].violations.push({
        elementId: end.id,
        isWarning: true,
        label: `End Event '${end.businessObject.name || 'Naamloos'}' heeft een generieke of ontbrekende naam. Gebruik de voltooide tijd (bijv. 'Order is verzonden').`
      });
    }
  });

  // Check 7: Gateways
  gateways.forEach(gw => {
    const isXorOrIor = gw.type === 'bpmn:ExclusiveGateway' || gw.type === 'bpmn:InclusiveGateway';
    if (isXorOrIor) {
      const outgoing = gw.outgoing || [];
      if (outgoing.length > 1) {
        const hasDefault = Boolean(gw.businessObject.default);
        const unlabelledFlows = outgoing.filter(flow => !flow.businessObject.name && flow.businessObject !== gw.businessObject.default);
        if (unlabelledFlows.length === outgoing.length && !hasDefault) {
          rulesReport[6].violations.push({
            elementId: gw.id,
            isWarning: true,
            label: `Gateway '${gw.businessObject.name || gw.id}' splitst in ${outgoing.length} paden, maar heeft geen conditienamen of default flow (\\\\) ingesteld.`
          });
        }
      }
    }
  });

  // Check 8: Task naming
  tasks.forEach(task => {
    const name = (task.businessObject.name || '').trim();
    if (!name) {
      rulesReport[7].violations.push({
        elementId: task.id,
        label: `Taak (${task.id}) heeft geen naam. Geef elke taak een duidelijke omschrijving.`
      });
    } else {
      const words = name.split(/\s+/);
      if (words.length < 2) {
        rulesReport[7].violations.push({
          elementId: task.id,
          isWarning: true,
          label: `Taak '${name}' bestaat uit slechts één woord. Richtlijn uit reader: minstens één zelfstandig naamwoord + werkwoord (bijv. 'Factuur controleren').`
        });
      }
    }
  });

  // Calculate totals and statuses
  rulesReport.forEach(rule => {
    const errorViolations = rule.violations.filter(v => !v.isWarning);
    const warningViolations = rule.violations.filter(v => v.isWarning);
    if (errorViolations.length > 0) {
      rule.status = 'failed';
      errorsCount += errorViolations.length;
    } else if (warningViolations.length > 0) {
      rule.status = 'warning';
      warningsCount += warningViolations.length;
    } else {
      rule.status = 'passed';
    }
  });

  // Update header badge
  const badgeEl = document.getElementById('rules-indicator-badge');
  if (badgeEl) {
    if (errorsCount > 0) {
      badgeEl.className = 'badge-status badge-error';
      badgeEl.textContent = `${errorsCount} ${errorsCount === 1 ? 'fout' : 'fouten'}`;
    } else if (warningsCount > 0) {
      badgeEl.className = 'badge-status badge-warning';
      badgeEl.textContent = `${warningsCount} ${warningsCount === 1 ? 'aandachtspunt' : 'aandachtspunten'}`;
    } else {
      badgeEl.className = 'badge-status badge-ok';
      badgeEl.textContent = '0 fouten (OK)';
    }
  }

  // If requested, open modal and render report
  if (openModal) {
    const modal = document.getElementById('modal-rules-checker');
    const container = document.getElementById('rules-checklist-container');
    const statStatus = document.getElementById('stat-overall-status');
    const statElements = document.getElementById('stat-elements-count');
    const statErrors = document.getElementById('stat-errors-count');
    const statWarnings = document.getElementById('stat-warnings-count');

    if (statElements) statElements.textContent = allElements.filter(el => !el.type.includes('Plane') && !el.type.includes('Process')).length;
    if (statErrors) statErrors.textContent = errorsCount;
    if (statWarnings) statWarnings.textContent = warningsCount;
    if (statStatus) {
      if (errorsCount > 0) {
        statStatus.textContent = 'Niet conform HHS-regels';
        statStatus.style.color = '#ef4444';
      } else if (warningsCount > 0) {
        statStatus.textContent = 'Enkele aandachtspunten';
        statStatus.style.color = '#f59e0b';
      } else {
        statStatus.textContent = 'Volledig conform HHS-regels!';
        statStatus.style.color = '#10b981';
      }
    }

    if (container) {
      container.innerHTML = rulesReport.map(rule => {
        let badgeHtml = '';
        if (rule.status === 'passed') {
          badgeHtml = '<span class="badge-status badge-ok">Geslaagd</span>';
        } else if (rule.status === 'warning') {
          badgeHtml = '<span class="badge-status badge-warning">Aandachtspunt</span>';
        } else {
          badgeHtml = '<span class="badge-status badge-error">Fout</span>';
        }

        let violationsHtml = '';
        if (rule.violations.length > 0) {
          violationsHtml = `
            <div class="rule-violations-list">
              ${rule.violations.map(v => `
                <button class="rule-violation-btn" onclick="highlightElement('${v.elementId || ''}')" title="Klik om dit element te tonen op canvas">
                  <i data-lucide="crosshair" style="width: 12px; height: 12px;"></i>
                  <span>${escapeHtml(v.label)}</span>
                </button>
              `).join('')}
            </div>
          `;
        }

        return `
          <div class="rule-item-card ${rule.status}">
            <div class="rule-item-header">
              <div class="rule-item-title-group">
                <div class="rule-item-icon">
                  <i data-lucide="${rule.status === 'passed' ? 'check' : (rule.status === 'warning' ? 'alert-triangle' : 'alert-octagon')}"></i>
                </div>
                <span class="rule-item-title">${escapeHtml(rule.title)}</span>
                <span class="rule-ref-tag">${escapeHtml(rule.ref)}</span>
              </div>
              ${badgeHtml}
            </div>
            <div class="rule-item-desc">${escapeHtml(rule.desc)}</div>
            ${violationsHtml}
          </div>
        `;
      }).join('');
    }

    modal.classList.add('open');
    refreshIcons();
  }
}
window.validateHHSRules = validateHHSRules;

// 9. Setup HHS BPMN Tools Sidebar
function setupSidebarTools() {
  const sidebar = document.getElementById('tools-sidebar');
  const toggleBtn = document.getElementById('btn-toggle-sidebar');
  
  if (toggleBtn && sidebar) {
    toggleBtn.addEventListener('click', () => {
      sidebar.classList.toggle('collapsed');
      const isCollapsed = sidebar.classList.contains('collapsed');
      toggleBtn.classList.toggle('active', !isCollapsed);
      localStorage.setItem('hhs_sidebar_collapsed', isCollapsed ? '1' : '0');
    });

    if (localStorage.getItem('hhs_sidebar_collapsed') === '1') {
      sidebar.classList.add('collapsed');
      toggleBtn.classList.remove('active');
    }
  }

  // Cards with data-bpmn-type
  document.querySelectorAll('.tool-card[data-bpmn-type]').forEach(card => {
    card.addEventListener('mousedown', (e) => {
      if (e.button !== 0) return;
      if (!bpmnModeler) return;

      const type = card.dataset.bpmnType;
      const isSubProcess = card.dataset.subprocessCollapsed === 'true';
      const elementFactory = bpmnModeler.get('elementFactory');
      const create = bpmnModeler.get('create');

      let shape;
      if (type === 'bpmn:Participant') {
        shape = elementFactory.createParticipantShape({ isExpanded: true });
      } else if (isSubProcess) {
        shape = elementFactory.createShape({ type: 'bpmn:SubProcess', isExpanded: false });
      } else {
        shape = elementFactory.createShape({ type });
      }

      create.start(e, shape);
    });

    // Also support single click to append if something is selected
    card.addEventListener('click', (e) => {
      if (!bpmnModeler) return;
      const type = card.dataset.bpmnType;
      const isSubProcess = card.dataset.subprocessCollapsed === 'true';
      const elementFactory = bpmnModeler.get('elementFactory');
      const autoPlace = bpmnModeler.get('autoPlace');
      const selection = bpmnModeler.get('selection').get();
      
      if (selection.length === 1 && !type.includes('Participant') && !type.includes('DataObject') && !type.includes('DataStore')) {
        try {
          let shape;
          if (isSubProcess) {
            shape = elementFactory.createShape({ type: 'bpmn:SubProcess', isExpanded: false });
          } else {
            shape = elementFactory.createShape({ type });
          }
          autoPlace.append(selection[0], shape);
          showToast(`${type.replace('bpmn:', '')} toegevoegd en verbonden`, 'success');
        } catch (err) {}
      }
    });
  });

  // Action buttons
  const btnConnect = document.getElementById('tool-btn-connect');
  if (btnConnect) {
    btnConnect.addEventListener('click', () => {
      if (!bpmnModeler) return;
      bpmnModeler.get('globalConnect').toggle();
      showToast('Verbindingstool geactiveerd: klik op bron en doel om te verbinden', 'info');
    });
  }

  const btnDefaultFlow = document.getElementById('tool-btn-default-flow');
  if (btnDefaultFlow) {
    btnDefaultFlow.addEventListener('click', () => toggleDefaultFlow());
  }

  const btnNettoData = document.getElementById('tool-btn-netto-data');
  if (btnNettoData) {
    btnNettoData.addEventListener('click', () => promptNettoData());
  }

  const btnDataStatus = document.getElementById('tool-btn-data-status');
  if (btnDataStatus) {
    btnDataStatus.addEventListener('click', () => promptDataStatus());
  }

  // Hand, Lasso, Space pills
  const btnHand = document.getElementById('tool-btn-hand');
  if (btnHand) {
    btnHand.addEventListener('click', (e) => {
      if (!bpmnModeler) return;
      bpmnModeler.get('handTool').activateHand(e, true);
    });
  }

  const btnLasso = document.getElementById('tool-btn-lasso');
  if (btnLasso) {
    btnLasso.addEventListener('click', (e) => {
      if (!bpmnModeler) return;
      bpmnModeler.get('lassoTool').activateLasso(e, true);
    });
  }

  const btnSpace = document.getElementById('tool-btn-space');
  if (btnSpace) {
    btnSpace.addEventListener('click', (e) => {
      if (!bpmnModeler) return;
      bpmnModeler.get('spaceTool').activateSpace(e, true);
    });
  }

  // Add swimlane
  const cardAddLane = document.querySelector('[data-action="add-lane"]');
  if (cardAddLane) {
    cardAddLane.addEventListener('click', () => addSwimlane());
  }
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
        'reader-plank': 'Figuur 3: Bevestigen van een plank (XOR)',
        'reader-diner': 'Figuur 13 & 22: Diner Keuzemenu (IOR & Default Flow)',
        'reader-parallel': 'Figuur 18: Parallel Proces (AND-split & join)',
        'reader-data': 'Figuur 25 & 27: Dataflow & Netto Data',
        'reader-pools': 'Figuur 31: Twee Pools & Message Flows',
        'swimlane': 'Basis Pool & Swimlanes',
        'order-to-cash': 'Order-to-Cash Proces',
        'exam': 'SaaS Project & Delivery Flow',
        'incident': 'Klachten- & Incidentafhandeling'
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

  // Modals Setup (Cheatsheet, Shortcuts & Rules Checker)
  const modalCheatsheet = document.getElementById('modal-cheatsheet');
  const modalShortcuts = document.getElementById('modal-shortcuts');
  const modalRules = document.getElementById('modal-rules-checker');

  // Rules Checker Modal triggers
  const btnValidateRules = document.getElementById('btn-validate-rules');
  if (btnValidateRules) {
    btnValidateRules.addEventListener('click', () => {
      validateHHSRules(true);
    });
  }
  const btnCloseRules = document.getElementById('btn-close-rules');
  if (btnCloseRules) {
    btnCloseRules.addEventListener('click', () => modalRules.classList.remove('open'));
  }
  const btnCloseRulesBottom = document.getElementById('btn-close-rules-bottom');
  if (btnCloseRulesBottom) {
    btnCloseRulesBottom.addEventListener('click', () => modalRules.classList.remove('open'));
  }

  // Cheatsheet modal
  document.getElementById('btn-cheatsheet').addEventListener('click', () => {
    modalCheatsheet.classList.add('open');
  });
  document.getElementById('btn-close-cheatsheet').addEventListener('click', () => {
    modalCheatsheet.classList.remove('open');
  });
  document.getElementById('btn-close-cheatsheet-bottom').addEventListener('click', () => {
    modalCheatsheet.classList.remove('open');
  });

  // Shortcuts modal
  document.getElementById('btn-shortcuts').addEventListener('click', () => {
    modalShortcuts.classList.add('open');
  });
  document.getElementById('btn-close-shortcuts').addEventListener('click', () => {
    modalShortcuts.classList.remove('open');
  });

  // Close modals on click outside
  [modalCheatsheet, modalShortcuts, modalRules].forEach(modal => {
    if (!modal) return;
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
      if (modalCheatsheet) modalCheatsheet.classList.remove('open');
      if (modalShortcuts) modalShortcuts.classList.remove('open');
      if (modalRules) modalRules.classList.remove('open');
      closeAllDropdowns();
    }

    // Ctrl + S triggers BPMN export
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      exportBPMN();
    }

    // Ctrl + B toggles sidebar
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      const sidebar = document.getElementById('tools-sidebar');
      const toggleBtn = document.getElementById('btn-toggle-sidebar');
      if (sidebar && toggleBtn) {
        sidebar.classList.toggle('collapsed');
        toggleBtn.classList.toggle('active', !sidebar.classList.contains('collapsed'));
      }
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
