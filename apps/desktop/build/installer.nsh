; Keep electron-builder's verified NSIS installation/removal implementation.
; The independent animation window survives the application being replaced.
!ifndef BUILD_UNINSTALLER
  Var EnturmaShouldRun
!else
  Var EnturmaRemoveData
!endif
!macro EnturmaSetupUX MODE
  Push $0
  Push $1
  InitPluginsDir
  File /oname=$PLUGINSDIR\EnturmaSetupUX.exe "${BUILD_RESOURCES_DIR}\EnturmaSetupUX.exe"
  File /oname=$PLUGINSDIR\install.gif "${BUILD_RESOURCES_DIR}\..\assets\motion\install.gif"
  File /oname=$PLUGINSDIR\update.gif "${BUILD_RESOURCES_DIR}\..\assets\motion\update.gif"
  File /oname=$PLUGINSDIR\uninstall.gif "${BUILD_RESOURCES_DIR}\..\assets\motion\uninstall.gif"
  System::Call 'kernel32::GetCurrentProcessId() i .r0'
  ClearErrors
  Exec '"$PLUGINSDIR\EnturmaSetupUX.exe" "${MODE}" "$0" "$PLUGINSDIR\${MODE}.gif" "$PLUGINSDIR\ux-ready"'
  ${IfNot} ${Errors}
    StrCpy $1 0
    ${Do}
      IfFileExists "$PLUGINSDIR\ux-ready" ux_ready_${MODE} 0
      Sleep 100
      IntOp $1 $1 + 1
    ${LoopWhile} $1 < 25
    Goto ux_fallback_${MODE}
    ux_ready_${MODE}:
      SetSilent silent
      Goto ux_done_${MODE}
  ${EndIf}
  ux_fallback_${MODE}:
    ; A missing runtime must never leave a silent, invisible operation.
    SetSilent normal
  ux_done_${MODE}:
  Pop $1
  Pop $0
!macroend

!macro customInit
  StrCpy $EnturmaShouldRun 0
  ${IfNot} ${Silent}
    StrCpy $EnturmaShouldRun 1
  ${EndIf}
  ${If} ${isUpdated}
    !insertmacro EnturmaSetupUX update
  ${Else}
    !insertmacro EnturmaSetupUX install
  ${EndIf}
!macroend

!macro customUnInit
  StrCpy $EnturmaRemoveData 0
  ; Updates invoke the old uninstaller; only the outer installer owns that UI.
  ${IfNot} ${isUpdated}
    ${IfNot} ${Silent}
      InitPluginsDir
      File /oname=$PLUGINSDIR\EnturmaSetupUX.exe "${BUILD_RESOURCES_DIR}\EnturmaSetupUX.exe"
      File /oname=$PLUGINSDIR\uninstall.gif "${BUILD_RESOURCES_DIR}\..\assets\motion\uninstall.gif"
      ClearErrors
      ExecWait '"$PLUGINSDIR\EnturmaSetupUX.exe" --uninstall-options "$PLUGINSDIR\uninstall.gif"' $0
      ${If} ${Errors}
        MessageBox MB_ICONSTOP "Não foi possível abrir a confirmação. Nenhum dado foi removido."
        Abort
      ${EndIf}
      ${If} $0 == 11
        StrCpy $EnturmaRemoveData 1
      ${ElseIf} $0 != 10
        Abort
      ${EndIf}
    ${EndIf}
    !insertmacro EnturmaSetupUX uninstall
  ${EndIf}
!macroend

!macro customUnInstall
  ${IfNot} ${isUpdated}
  ${AndIf} $EnturmaRemoveData == 1
    ExecWait '"$PLUGINSDIR\EnturmaSetupUX.exe" --remove-local-data' $0
    ${If} $0 != 0
      MessageBox MB_ICONEXCLAMATION "O aplicativo foi removido, mas alguns dados locais estão em uso ou protegidos. Eles foram preservados."
      SetErrorLevel 4
    ${EndIf}
  ${EndIf}
!macroend

!macro customInstall
  ; Native animation makes NSIS silent; retain first-install launch behavior.
  ${If} $EnturmaShouldRun == 1
  ${AndIf} ${Silent}
  ${AndIfNot} ${isForceRun}
    SetSilent normal
  ${EndIf}
!macroend
