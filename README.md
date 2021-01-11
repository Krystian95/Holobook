# Holobook

This is an [Holochain](https://holochain.org/) Application (hApp) that simulates a social network (like Facebook). The project was made inside the exam of the [Peer-to-peer Systems](https://www.unibo.it/en/teaching/course-unit-catalogue/course-unit/2019/400431) course.

- - - - - - - - - - - - - - - - - - - - - - - 

**Requirements**
- Holochain (see https://developer.holochain.org/docs/install/)

To execute the application first:

**Update the application HASH**


Run inside a terminal:
- ```nix-shell https://holochain.love```
- ```cd [...]/Holobook/holobook```
- ```hc package```


Copy and paste the "DNA hash" value inside the property [[instances]] "dna_hash" of ```holobook/bundle.toml```

To execute the application run a shell for the DHT and another shell for each agent you'd like to have. Then execute the following commands:

**DHT**
   - ```nix-shell https://holochain.love```
   - ```sim2h_server```

**Alice**
  - ```nix-shell https://holochain.love```
  - ```cd [...]/Holobook/holobook```
  - ```hc run --networked sim2h --agent-name Alice --port 8888```
    
**Bob**
  - ```nix-shell https://holochain.love```
  - ```cd [...]/Holobook/holobook```
  - ```hc run --networked sim2h --agent-name Bob --port 8889```
  
**Carl**
  - ```nix-shell https://holochain.love```
  - ```cd [...]/Holobook/holobook```
  - ```hc run --networked sim2h --agent-name Carl --port 8890```
